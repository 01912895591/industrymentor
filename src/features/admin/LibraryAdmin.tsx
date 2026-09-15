import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Trash2, Image as ImageIcon, Upload, Pencil } from "lucide-react";

type LibraryItemRow = {
  id: string;
  item_type: "ebook" | "sop";
  item_key: string;
  title: string;
  description: string | null;
  price_cents: number;
  published: boolean;
  file_path: string | null;
  thumbnail_path: string | null;
  image_url: string | null;
  created_at: string;
  industry: string | null;
  category: string | null;
};

function keyify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function LibraryAdmin() {
  const [rows, setRows] = useState<LibraryItemRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<LibraryItemRow | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const [itemType, setItemType] = useState<"ebook" | "sop">("ebook");
  const [title, setTitle] = useState("");
  const [itemKey, setItemKey] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [published, setPublished] = useState(false);
  const [industry, setIndustry] = useState("");
  const [category, setCategory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const computedKey = useMemo(() => (itemKey ? keyify(itemKey) : keyify(title)), [itemKey, title]);

  const resetForm = () => {
    setEditing(null);
    setItemType("ebook");
    setTitle("");
    setItemKey("");
    setDescription("");
    setPrice("");
    setPublished(false);
    setIndustry("");
    setCategory("");
    setFile(null);
    setImageUrl("");
  };

  const load = async () => {
    setBusy(true);
    setDbError(null);
    try {
      const { data, error } = await (supabase as any)
        .from("library_items")
        .select("id,item_type,item_key,title,description,price_cents,published,file_path,thumbnail_path,image_url,created_at,industry,category")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        if (error.message?.includes("column") && error.message?.includes("image_url")) {
          setDbError("missing_column");
          return;
        }
        throw error;
      }
      setRows(data ?? []);
    } catch (e: any) {
      toast({ title: "Failed to load library items", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const onEdit = (it: LibraryItemRow) => {
    setEditing(it);
    setItemType(it.item_type);
    setTitle(it.title);
    setItemKey(it.item_key);
    setDescription(it.description ?? "");
    setPrice(String((it.price_cents ?? 0) / 100));
    setPublished(Boolean(it.published));
    setIndustry(it.industry ?? "");
    setCategory(it.category ?? "");
    setFile(null);
    setImageUrl(it.image_url ?? "");
  };

  const uploadFileIfNeeded = async () => {
    if (!file) return null;
    const safeKey = computedKey;
    const ext = file.name.split(".").pop() || "bin";
    const path = `${itemType}/${safeKey}.${ext}`;

    const { error } = await supabase.storage.from("library").upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    });

    if (error) throw error;
    return path;
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;

      setUploading(true);
      const file = event.target.files[0];

      // Optimization step: Resize and compress using Canvas
      const optimizedBlob = await new Promise<Blob>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const maxSize = 800;

            if (width > height) {
              if (width > maxSize) {
                height *= maxSize / width;
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width *= maxSize / height;
                height = maxSize;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx?.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Canvas toBlob failed"));
            }, "image/jpeg", 0.8);
          };
          img.onerror = reject;
          img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fileName = `library-${itemType}-${Date.now()}.jpg`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("site_assets")
        .upload(filePath, optimizedBlob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("site_assets")
        .getPublicUrl(filePath);

      setImageUrl(publicUrl);
      toast({ title: "Cover image uploaded and optimized" });
      event.target.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    const safeKey = computedKey;
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!safeKey) {
      toast({ title: "Key is required", variant: "destructive" });
      return;
    }

    const priceCents = Math.max(0, Math.round((Number(price || 0) || 0) * 100));

    setBusy(true);
    try {
      const filePath = await uploadFileIfNeeded();

      if (editing) {
        const { error } = await (supabase as any)
          .from("library_items")
          .update({
            item_type: itemType,
            item_key: safeKey,
            title: title.trim(),
            description: description || null,
            price_cents: priceCents,
            published,
            industry: industry || null,
            category: category || null,
            image_url: imageUrl || null,
            ...(filePath ? { file_path: filePath } : {}),
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast({ title: "Library item updated" });
      } else {
        const { error } = await (supabase as any)
          .from("library_items")
          .insert({
            item_type: itemType,
            item_key: safeKey,
            title: title.trim(),
            description: description || null,
            price_cents: priceCents,
            published,
            industry: industry || null,
            category: category || null,
            image_url: imageUrl || null,
            file_path: filePath,
          });
        if (error) throw error;
        toast({ title: "Library item created" });
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
    if (!confirm("Delete this library item?")) return;
    setBusy(true);
    try {
      const { error } = await (supabase as any).from("library_items").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Library item deleted" });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {dbError === "missing_column" && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-6 shadow-xs">
          <div className="flex items-center gap-3 text-destructive mb-4">
            <AlertCircle className="h-6 w-6 shrink-0" />
            <div className="text-base font-bold uppercase">Database Update Required</div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">image_url</code> column is missing from your <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">library_items</code> table.
          </p>
          <div className="bg-black/80 p-4 rounded-xl border border-border/60 mb-6">
            <p className="text-xs text-green-400 font-mono mb-2">-- Run this in your Supabase SQL Editor:</p>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
              {`ALTER TABLE public.library_items 
ADD COLUMN IF NOT EXISTS image_url text;`}
            </pre>
          </div>
          <Button onClick={() => void load()} variant="outline" size="sm">
            I've run the SQL, Refresh
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card/40 p-6 shadow-xs">
        <div className="flex flex-col gap-1">
          <div className="text-lg font-bold">Library (E‑Books + SOPs)</div>
          <p className="text-sm text-muted-foreground">Upload files to private storage and manage metadata.</p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <div className="flex gap-2">
              <Button variant={itemType === "ebook" ? "hero" : "soft"} type="button" onClick={() => setItemType("ebook")}>
                E‑Book
              </Button>
              <Button variant={itemType === "sop" ? "hero" : "soft"} type="button" onClick={() => setItemType("sop")}>
                SOP
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="libPrice">Price (BDT)</Label>
            <Input id="libPrice" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="2000" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="libTitle">Title</Label>
            <Input id="libTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Merchandising SOP Pack" />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="libKey">Key</Label>
            <Input id="libKey" value={itemKey} onChange={(e) => setItemKey(e.target.value)} placeholder="merchandising-sop-pack" />
            <div className="text-xs text-muted-foreground">
              Will save as: <span className="font-medium text-foreground">{computedKey || "—"}</span>
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="libDesc">Description</Label>
            <Textarea id="libDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What’s inside" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="libIndustry">Industry</Label>
            <Input id="libIndustry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Garments, Footwear..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="libCategory">Category/Department</Label>
            <Input id="libCategory" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Quality, HR, Production..." />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="libFile">File</Label>
            <Input
              id="libFile"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <div className="text-xs text-muted-foreground">
              {editing?.file_path ? `Current file: ${editing.file_path}` : "Supported formats: PDF, Word, Excel, PPT."}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Cover Page Image</Label>
            <div className="flex items-start gap-4">
              {imageUrl ? (
                <div className="relative group aspect-[3/4] w-24 overflow-hidden rounded-lg border bg-muted shadow-xs">
                  <img src={imageUrl} alt="Cover" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImageUrl("")}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-32 w-24 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-[10px] text-center px-2 text-muted-foreground">
                  No cover image
                </div>
              )}

              <div className="space-y-2">
                <Button asChild variant="soft" size="sm" disabled={uploading}>
                  <label className="cursor-pointer flex items-center gap-2">
                    {uploading ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <ImageIcon className="h-3.5 w-3.5" />
                    )}
                    {uploading ? "Uploading..." : "Upload Cover"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </Button>
                <div className="text-[10px] text-muted-foreground max-w-[150px]">
                  Auto-optimized to 800px max. Recommended: Book cover ratio (3:4 or 2:3).
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-current" />
              Published
            </label>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button variant="hero" disabled={busy} onClick={() => void onSave()}>
            {editing ? "Save changes" : "Create item"}
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
          <div className="text-lg font-bold">Recent items</div>
          <div className="text-sm text-muted-foreground">{rows.length} total</div>
        </div>

        <div className="mt-4 space-y-3">
          {rows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No library items yet.</div>
          ) : (
            rows.map((it) => (
              <div key={it.id} className="rounded-xl border border-border/60 bg-card/20 p-4 transition-all hover:bg-card/40">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex flex-1 gap-4">
                    <div className="h-16 w-12 rounded bg-muted overflow-hidden flex-shrink-0 border border-border/40">
                      {it.image_url ? (
                        <img src={it.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/30">NA</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{it.title}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <Badge variant="outline" className="text-[10px] uppercase font-mono font-medium">
                          {it.item_type === "ebook" ? "E-Book" : "SOP"}
                        </Badge>
                        {it.published ? (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-medium uppercase">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-medium uppercase">
                            Draft
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">• key: {it.item_key}</span>
                        <span className="text-xs font-semibold text-foreground">৳{Math.round(it.price_cents / 100).toLocaleString()}</span>
                      </div>
                      {it.file_path && <div className="mt-1 text-xs text-muted-foreground truncate max-w-md">File: {it.file_path}</div>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" className="h-8 text-primary hover:bg-primary/10" disabled={busy} onClick={() => onEdit(it)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10" disabled={busy} onClick={() => void onDelete(it.id)}>
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Delete
                    </Button>
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
