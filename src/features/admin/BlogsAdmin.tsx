import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Image as ImageIcon, Plus, Trash2, Database, AlertCircle } from "lucide-react";

type BlogRow = {
    id: string;
    title: string;
    slug: string;
    content: string | null;
    excerpt: string | null;
    cover_image_url: string | null;
    published: boolean;
    created_at: string;
};

export function BlogsAdmin() {
    const [blogs, setBlogs] = useState<BlogRow[]>([]);
    const [busy, setBusy] = useState(false);
    const [editing, setEditing] = useState<BlogRow | null>(null);
    const [tableMissing, setTableMissing] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [content, setContent] = useState("");
    const [excerpt, setExcerpt] = useState("");
    const [coverImage, setCoverImage] = useState("");
    const [published, setPublished] = useState(false);

    const resetForm = () => {
        setEditing(null);
        setTitle("");
        setSlug("");
        setContent("");
        setExcerpt("");
        setCoverImage("");
        setPublished(false);
    };

    const load = async () => {
        setBusy(true);
        setTableMissing(false);
        try {
            const { data, error } = await (supabase as any)
                .from("blogs")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) {
                if (error.code === "42P01" || error.message?.includes("Could not find the table")) {
                    setTableMissing(true);
                    return;
                }
                throw error;
            }
            setBlogs(data || []);
        } catch (e: any) {
            toast({ title: "Load failed", description: e?.message ?? "Unknown error", variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    useEffect(() => {
        void load();
    }, []);

    const generateSlug = (val: string) => {
        return val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    };

    const onTitleChange = (val: string) => {
        setTitle(val);
        if (!editing) {
            setSlug(generateSlug(val));
        }
    };

    const onSave = async () => {
        if (!title.trim() || !slug.trim()) {
            toast({ title: "Title and slug are required", variant: "destructive" });
            return;
        }

        const payload = {
            title: title.trim(),
            slug: slug.trim(),
            content: content.trim() || null,
            excerpt: excerpt.trim() || null,
            cover_image_url: coverImage.trim() || null,
            published,
            updated_at: new Date().toISOString(),
        };

        setBusy(true);
        try {
            if (editing) {
                const { error } = await (supabase as any).from("blogs").update(payload).eq("id", editing.id);
                if (error) throw error;
                toast({ title: "Blog updated" });
            } else {
                const { error } = await (supabase as any).from("blogs").insert(payload);
                if (error) throw error;
                toast({ title: "Blog created" });
            }
            resetForm();
            await load();
        } catch (e: any) {
            toast({ title: "Save failed", description: e?.message ?? "Unknown error", variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    const onEdit = (blog: BlogRow) => {
        setEditing(blog);
        setTitle(blog.title);
        setSlug(blog.slug);
        setContent(blog.content || "");
        setExcerpt(blog.excerpt || "");
        setCoverImage(blog.cover_image_url || "");
        setPublished(blog.published);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            setUploading(true);
            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `blog-cover-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from("site_assets")
                .upload(filePath, file);

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
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const onDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this blog post?")) return;
        setBusy(true);
        try {
            const { error } = await (supabase as any).from("blogs").delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Blog deleted" });
            await load();
        } catch (e: any) {
            toast({ title: "Delete failed", description: e?.message ?? "Unknown error", variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    if (tableMissing) {
        return (
            <div className="space-y-8 animate-fade-in">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Blog Management</h2>
                    <p className="text-muted-foreground">Create and share insights with your audience.</p>
                </div>
                <Card className="rounded-3xl border border-destructive/50 bg-destructive/10 shadow-elev">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-6 w-6" />
                            Database Setup Required
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            The <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono">public.blogs</code> table is missing from your database.
                        </p>
                        <div className="bg-card/50 p-4 rounded-xl border border-border/60">
                            <p className="text-sm font-semibold mb-2">How to fix:</p>
                            <p className="text-sm text-muted-foreground mb-2">Run the provided migration SQL in your [Supabase SQL Editor](https://supabase.com/dashboard/project/fiirnhpsldouvnfvbtun/sql/new):</p>
                            <pre className="overflow-x-auto p-4 rounded-lg bg-black/80 text-xs text-green-400 font-mono">
                                {`-- 1. Create enum type for roles (if missing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- 2. Create user_roles table (if missing)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create helper function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- 4. Create blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  excerpt text,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 5. Create Policies
DROP POLICY IF EXISTS "Public can view published blogs" ON public.blogs;
CREATE POLICY "Public can view published blogs" ON public.blogs FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blogs;
CREATE POLICY "Admins can manage blogs" ON public.blogs FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::public.app_role)) 
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN new.updated_at = now(); return new; END; $$;

DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON public.blogs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();`}
                            </pre>
                        </div>
                        <Button onClick={load} variant="outline" className="gap-2">
                            I've run the migration, try again
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Blog Management</h2>
                    <p className="text-muted-foreground">Create and share insights with your audience.</p>
                </div>
                <Button variant="soft" onClick={resetForm} disabled={!editing}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Post
                </Button>
            </div>

            {/* Editor Card */}
            <Card className="rounded-3xl border border-border/60 bg-card/25 shadow-elev">
                <CardHeader>
                    <CardTitle className="text-xl font-extrabold">
                        {editing ? "Edit Post" : "Create New Post"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input value={title} onChange={(e) => onTitleChange(e.target.value)} placeholder="How to master React..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="how-to-master-react" />
                        </div>
                    </div>

                    {/* New Image Upload Section */}
                    <div className="space-y-2">
                        <Label>Cover Image</Label>
                        <div className="flex items-start gap-4">
                            {coverImage ? (
                                <div className="relative group aspect-video w-40 overflow-hidden rounded-lg border bg-muted">
                                    <img src={coverImage} alt="Cover" className="h-full w-full object-cover" />
                                    <button
                                        onClick={() => setCoverImage("")}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove image"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed bg-muted/50 text-xs text-muted-foreground">
                                    No image
                                </div>
                            )}

                            <div className="space-y-2">
                                <Button asChild variant="secondary" size="sm" disabled={uploading}>
                                    <Label htmlFor="blog-cover-upload" className="cursor-pointer gap-2">
                                        {uploading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        ) : (
                                            <ImageIcon className="h-4 w-4" />
                                        )}
                                        {uploading ? "Uploading..." : "Upload Image"}
                                        <Input
                                            id="blog-cover-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </Label>
                                </Button>
                                <div className="text-xs text-muted-foreground">
                                    Recommended: 16:9 aspect ratio
                                </div>
                            </div>
                        </div>
                        {/* Hidden input to keep state sync if needed */}
                        <div className="sr-only">
                            <Input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Excerpt (Short summary)</Label>
                        <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="A brief preview of the post..." />
                    </div>

                    <div className="space-y-2">
                        <Label>Content (Markdown or Plain Text)</Label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your blog content here..."
                            className="min-h-[300px]"
                        />
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            Published
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border/40">
                        <Button variant="hero" disabled={busy} onClick={onSave} className="px-8">
                            {editing ? "Update Post" : "Create Post"}
                        </Button>
                        <Button variant="soft" disabled={busy} onClick={resetForm}>
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List Card */}
            <Card className="rounded-3xl border border-border/60 bg-card/25 shadow-elev">
                <CardHeader>
                    <CardTitle className="text-xl font-extrabold flex items-center justify-between">
                        Recent Posts
                        <Button variant="ghost" size="sm" onClick={load} disabled={busy}>Refresh</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {blogs.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">No blog posts found.</div>
                        ) : (
                            blogs.map((blog) => (
                                <div key={blog.id} className="group relative flex items-center gap-4 p-4 rounded-2xl border border-border/70 bg-background/20 transition-all hover:bg-background/40">
                                    <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                                        {blog.cover_image_url ? (
                                            <img src={blog.cover_image_url} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-muted-foreground/30">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold flex items-center gap-2 truncate">
                                            {blog.title}
                                            {!blog.published && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase">Draft</span>
                                            )}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground flex items-center gap-3">
                                            <span className="truncate">/{blog.slug}</span>
                                            <span className="flex-shrink-0">•</span>
                                            <span className="flex-shrink-0">{new Date(blog.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => onEdit(blog)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => onDelete(blog.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
