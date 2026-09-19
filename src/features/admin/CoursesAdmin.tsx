import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { CourseModulesDialog } from "./CourseModulesDialog";
import { sanitizers, validators } from "@/lib/validation";
import { formatCourseTitle } from "@/lib/formatTitle";
import { optimizeImage } from "@/lib/imageOptimizer";

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  published: boolean;
  cover_image_path: string | null;
  mode: string;
  rating: number;
  reviews: number;
  badge_text: string;
  instructor_heading: string;
  instructor_subheading: string;
  old_price_cents: number | null;
  created_at: string;
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function CoursesAdmin() {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<CourseRow | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [coverImage, setCoverImage] = useState("");
  const [published, setPublished] = useState(false);
  const [mode, setMode] = useState("online");
  const [rating, setRating] = useState("5.0");
  const [reviews, setReviews] = useState("0");
  const [badgeText, setBadgeText] = useState("Professional");
  const [instructorHeading, setInstructorHeading] = useState("Taught by Experts");
  const [instructorSubheading, setInstructorSubheading] = useState("Industry Professionals");
  const [oldPrice, setOldPrice] = useState<string>("");

  const computedSlug = useMemo(() => (slug ? slugify(slug) : slugify(title)), [slug, title]);

  // Handle draft persistence
  useEffect(() => {
    if (!editing) {
      const draft = localStorage.getItem("course_draft");
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setTitle(parsed.title || "");
          setSlug(parsed.slug || "");
          setDescription(parsed.description || "");
          setPrice(parsed.price || "");
          setCoverImage(parsed.coverImage || "");
          setPublished(parsed.published || false);
          setMode(parsed.mode || "online");
          setRating(parsed.rating || "5.0");
          setReviews(parsed.reviews || "0");
          setBadgeText(parsed.badgeText || "Professional");
          setInstructorHeading(parsed.instructorHeading || "Taught by Experts");
          setInstructorSubheading(parsed.instructorSubheading || "Industry Professionals");
          setOldPrice(parsed.oldPrice || "");
        } catch (e) {
          console.error("Failed to load course draft", e);
        }
      }
    }
  }, [editing]);

  useEffect(() => {
    if (!editing && (title || slug || description || price || coverImage)) {
      localStorage.setItem("course_draft", JSON.stringify({
        title, slug, description, price, coverImage, published, mode, rating, reviews, badgeText, instructorHeading, instructorSubheading, oldPrice
      }));
    }
  }, [title, slug, description, price, coverImage, published, editing, mode, rating, reviews, badgeText, instructorHeading, instructorSubheading]);

  const resetForm = () => {
    setEditing(null);
    setTitle("");
    setSlug("");
    setDescription("");
    setPrice("");
    setCoverImage("");
    setPublished(false);
    setMode("online");
    setRating("5.0");
    setReviews("0");
    setBadgeText("Professional");
    setInstructorHeading("Taught by Experts");
    setInstructorSubheading("Industry Professionals");
    setOldPrice("");
    localStorage.removeItem("course_draft");
  };

  const load = async () => {
    setBusy(true);
    try {
      const { data, error } = await (supabase as any)
        .from("courses")
        .select("id,title,slug,description,price_cents,published,cover_image_path,created_at,mode,rating,reviews,badge_text,instructor_heading,instructor_subheading,old_price_cents")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      setRows(data ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load courses", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onEdit = (c: CourseRow) => {
    setEditing(c);
    setTitle(c.title);
    setSlug(c.slug);
    setDescription(c.description ?? "");
    setPrice(String((c.price_cents ?? 0) / 100));
    setCoverImage(c.cover_image_path ?? "");
    setPublished(Boolean(c.published));
    setMode(c.mode || "online");
    setRating(String(c.rating || "5.0"));
    setReviews(String(c.reviews || "0"));
    setBadgeText(c.badge_text || "Professional");
    setInstructorHeading(c.instructor_heading || "Taught by Experts");
    setInstructorSubheading(c.instructor_subheading || "Industry Professionals");
    setOldPrice(c.old_price_cents ? String(c.old_price_cents / 100) : "");
  };

  const onSave = async () => {
    const safeSlug = computedSlug;

    // Enhanced validation
    if (!validators.isValidLength(title, 1, 200)) {
      toast({ title: "Invalid Title", description: "Title must be between 1 and 200 characters", variant: "destructive" });
      return;
    }
    if (!safeSlug || !validators.isValidLength(safeSlug, 1, 200)) {
      toast({ title: "Invalid Slug", description: "Please provide a valid slug", variant: "destructive" });
      return;
    }

    const priceCents = Math.max(0, Math.round((Number(price || 0) || 0) * 100));
    const oldPriceCents = oldPrice ? Math.max(0, Math.round((Number(oldPrice || 0) || 0) * 100)) : null;

    setBusy(true);
    try {
      if (editing) {
        const { error } = await (supabase as any)
          .from("courses")
          .update({
            title: title.trim(),
            slug: safeSlug,
            description: description || null,
            price_cents: priceCents,
            cover_image_path: coverImage.trim() || null,
            published,
            mode,
            rating: parseFloat(rating) || 5.0,
            reviews: parseInt(reviews) || 0,
            badge_text: badgeText.trim(),
            instructor_heading: instructorHeading.trim(),
            instructor_subheading: instructorSubheading.trim(),
            old_price_cents: oldPriceCents,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Course updated" });
      } else {
        const { error } = await (supabase as any).from("courses").insert({
          title: title.trim(),
          slug: safeSlug,
          description: description || null,
          price_cents: priceCents,
          cover_image_path: coverImage.trim() || null,
          published,
          mode,
          rating: parseFloat(rating) || 5.0,
          reviews: parseInt(reviews) || 0,
          badge_text: badgeText.trim(),
          instructor_heading: instructorHeading.trim(),
          instructor_subheading: instructorSubheading.trim(),
          old_price_cents: oldPriceCents,
        });
        if (error) throw error;
        toast({ title: "Course created" });
      }

      resetForm();
      await load();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("courses").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Course deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const [uploading, setUploading] = useState(false);

  // ... (existing helper functions)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      setUploading(true);
      const file = event.target.files[0];

      // Safe optimization for course cover
      let uploadFile: File = file;
      try {
        const result = await optimizeImage(file, {
          assetType: "course_cover",
          maxDimension: 1200,
          quality: 0.82,
        });
        uploadFile = result.file;
      } catch (optErr) {
        console.warn("[CoursesAdmin] Optimization fallback to original file:", optErr);
        uploadFile = file;
      }

      const fileExt = uploadFile.name.split(".").pop()?.toLowerCase() || (uploadFile.type === "image/webp" ? "webp" : "jpg");
      const fileName = `course-cover-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Storage with matching contentType and long-term cache
      const { error: uploadError } = await supabase.storage
        .from("site_assets")
        .upload(filePath, uploadFile, {
          contentType: uploadFile.type || "image/webp",
          cacheControl: "31536000",
        });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("site_assets")
        .getPublicUrl(filePath);

      setCoverImage(publicUrl);
      toast({ title: "Image uploaded successfully" });

      // Reset input
      event.target.value = "";

    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({ title: "Upload failed", description: error?.message || "Failed to upload image. Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-bold">Courses</div>
          <p className="text-sm text-muted-foreground">Create, edit, publish, and delete courses.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            {/* ... existing Title input ... */}
            <Label htmlFor="courseTitle">Title</Label>
            <Input id="courseTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" />
          </div>
          <div className="space-y-2">
            {/* ... existing Slug input ... */}
            <Label htmlFor="courseSlug">Slug</Label>
            <Input
              id="courseSlug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="garment-industry-foundations"
            />
            <div className="text-xs text-muted-foreground">Will save as: <span className="font-medium text-foreground">{computedSlug || "—"}</span></div>
          </div>
          <div className="space-y-2 md:col-span-2">
            {/* ... existing Description input ... */}
            <Label htmlFor="courseDesc">Description</Label>
            <Textarea id="courseDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coursePrice">Price (BDT)</Label>
            <Input id="coursePrice" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="5000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="oldPrice">Old Price (Optional - for 'was' display)</Label>
            <Input id="oldPrice" inputMode="decimal" value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} placeholder="6000" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseMode">Course Mode</Label>
            <select
              id="courseMode"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseRating">Rating (e.g. 5.0)</Label>
            <Input id="courseRating" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="5.0" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseReviews">Review Count</Label>
            <Input id="courseReviews" type="number" value={reviews} onChange={(e) => setReviews(e.target.value)} placeholder="124" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="badgeText">Badge Text</Label>
            <Input id="badgeText" value={badgeText} onChange={(e) => setBadgeText(e.target.value)} placeholder="Professional" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructorHeading">Instructor Heading</Label>
            <Input id="instructorHeading" value={instructorHeading} onChange={(e) => setInstructorHeading(e.target.value)} placeholder="Taught by Experts" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructorSubheading">Instructor Subheading</Label>
            <Input id="instructorSubheading" value={instructorSubheading} onChange={(e) => setInstructorSubheading(e.target.value)} placeholder="Industry Professionals" />
          </div>

          {/* New Image Upload Section */}
          <div className="space-y-2 md:col-span-2">
            <Label>Cover Image</Label>
            <div className="flex items-start gap-4">
              {coverImage ? (
                <div className="relative group aspect-video w-40 overflow-hidden rounded-lg border bg-muted">
                  <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setCoverImage("")}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
                  No image
                </div>
              )}

              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="cursor-pointer file:cursor-pointer"
                />
                <div className="text-xs text-muted-foreground">
                  Recommended: 16:9 aspect ratio (e.g. 1280x720)
                </div>
              </div>
            </div>
            {/* Hidden input to store URL directly if needed, mainly for debugging or manual override if user wants */}
            <Input
              className="hidden"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Image URL"
            />
          </div>

          <div className="flex items-end gap-3">
            {/* ... existing Published checkbox ... */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
                className="h-4 w-4 accent-current"
              />
              Published
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* ... existing buttons ... */}
          <Button variant="hero" disabled={busy || uploading} onClick={() => void onSave()}>
            {editing ? "Save changes" : "Create course"}
          </Button>
          <Button variant="soft" disabled={busy} onClick={() => resetForm()}>
            Clear
          </Button>
          <div className="ml-auto" />
          <Button variant="soft" disabled={busy} onClick={() => void load()}>
            {busy ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="text-lg font-bold">Recent courses</div>
          <div className="text-sm text-muted-foreground">{rows.length} total</div>
        </div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">No courses yet.</div>
          ) : (
            rows.map((c) => (
              <div key={c.id} className="rounded-xl border border-border/70 bg-background/20 p-4 transition-all hover:bg-background/40">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4 min-w-0">
                    {c.cover_image_path && (
                      <img
                        src={c.cover_image_path}
                        alt={c.title}
                        className="h-16 w-24 rounded-lg object-cover bg-muted shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-base">{formatCourseTitle(c.title)}</span>
                        {c.published ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-medium shrink-0">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 bg-amber-500/10 text-amber-500 font-medium shrink-0">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground line-clamp-1">
                        /{c.slug} • ৳{(c.price_cents / 100).toFixed(0)} • {c.mode || "Online"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CourseModulesDialog courseId={c.id} courseTitle={formatCourseTitle(c.title)} />
                    <Button variant="soft" size="sm" disabled={busy} onClick={() => onEdit(c)}>Edit</Button>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => void onDelete(c.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
