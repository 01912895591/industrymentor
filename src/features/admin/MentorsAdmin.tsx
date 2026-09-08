
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image as ImageIcon, Trash2, Plus, Pencil, Loader2, Linkedin, Edit } from "lucide-react";

type Mentor = {
    id: string;
    name: string;
    title: string;
    bio: string | null;
    initials: string | null;
    tags: string[] | null;
    linkedin_url: string | null;
    image_path: string | null;
    created_at: string;
};

export function MentorsAdmin() {
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editing, setEditing] = useState<Mentor | null>(null);

    // Form states
    const [name, setName] = useState("");
    const [title, setTitle] = useState("");
    const [bio, setBio] = useState("");
    const [initials, setInitials] = useState("");
    const [tags, setTags] = useState("");
    const [linkedin_url, setLinkedinUrl] = useState("");
    const [imagePath, setImagePath] = useState("");

    const resetForm = () => {
        setEditing(null);
        setName("");
        setTitle("");
        setBio("");
        setInitials("");
        setTags("");
        setLinkedinUrl("");
        setImagePath("");
    };

    const loadMentors = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from("mentors" as any) as any)
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            setMentors((data as any) || []);
        } catch (e: any) {
            toast({ title: "Failed to load mentors", description: e.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadMentors();
    }, []);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            setUploading(true);
            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `mentor-${Date.now()}.${fileExt}`;
            const filePath = `mentors/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("site_assets")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("site_assets")
                .getPublicUrl(filePath);

            setImagePath(publicUrl);
            toast({ title: "Image uploaded successfully" });
            event.target.value = "";
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const onSave = async () => {
        if (!name || !title) {
            toast({ title: "Name and Title are required", variant: "destructive" });
            return;
        }

        setBusy(true);
        const mentorData = {
            name,
            title,
            bio,
            initials: initials || name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2),
            tags: tags.split(",").map(t => t.trim()).filter(Boolean),
            linkedin_url: linkedin_url,
            image_path: imagePath,
        };

        try {
            if (editing) {
                const { error } = await (supabase
                    .from("mentors" as any) as any)
                    .update(mentorData)
                    .eq("id", editing.id);
                if (error) throw error;
                toast({ title: "Mentor updated successfully" });
            } else {
                const { error } = await (supabase
                    .from("mentors" as any) as any)
                    .insert([mentorData]);
                if (error) throw error;
                toast({ title: "Mentor added successfully" });
            }
            resetForm();
            await loadMentors();
        } catch (e: any) {
            toast({ title: "Save failed", description: e.message, variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    const onEdit = (m: Mentor) => {
        setEditing(m);
        setName(m.name);
        setTitle(m.title);
        setBio(m.bio || "");
        setInitials(m.initials || "");
        setTags(m.tags?.join(", ") || "");
        setLinkedinUrl(m.linkedin_url || "");
        setImagePath(m.image_path || "");
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const onDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this mentor?")) return;
        setBusy(true);
        try {
            const { error } = await (supabase.from("mentors" as any) as any).delete().eq("id", id);
            if (error) throw error;
            toast({ title: "Mentor deleted" });
            await loadMentors();
        } catch (e: any) {
            toast({ title: "Delete failed", description: e.message, variant: "destructive" });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black tracking-tight">Mentor Management</h2>
                    <p className="text-muted-foreground">Manage your team of expert mentors.</p>
                </div>
                <Button variant="soft" onClick={resetForm} disabled={!editing}>
                    <Plus className="mr-2 h-4 w-4" />
                    New Mentor
                </Button>
            </div>

            {/* Editor Card - Matching BlogsAdmin style */}
            <Card className="rounded-3xl border border-border/60 bg-card/25 shadow-elev">
                <CardHeader>
                    <CardTitle className="text-xl font-extrabold">
                        {editing ? "Edit Mentor profile" : "Create New Mentor"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Sarah Jenkins" />
                        </div>
                        <div className="space-y-2">
                            <Label>Headline / Title</Label>
                            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Software Engineer" />
                        </div>
                    </div>

                    {/* Image Upload Section - Matching BlogsAdmin style (16:9 aspect) */}
                    <div className="space-y-2">
                        <Label>Profile Portrait</Label>
                        <div className="flex items-start gap-4">
                            {imagePath ? (
                                <div className="relative group aspect-video w-40 overflow-hidden rounded-lg border bg-muted">
                                    <img src={imagePath} alt="Preview" className="h-full w-full object-cover" />
                                    <button
                                        onClick={() => setImagePath("")}
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
                                    <Label htmlFor="mentor-image-upload" className="cursor-pointer gap-2">
                                        {uploading ? (
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                        ) : (
                                            <ImageIcon className="h-4 w-4" />
                                        )}
                                        {uploading ? "Uploading..." : "Upload Image"}
                                        <Input
                                            id="mentor-image-upload"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={uploading}
                                            className="hidden"
                                        />
                                    </Label>
                                </Button>
                                <div className="text-xs text-muted-foreground">
                                    Recommended: High quality portrait
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Initials (Optional)</Label>
                            <Input value={initials} onChange={(e) => setInitials(e.target.value)} placeholder="SJ" maxLength={2} />
                        </div>
                        <div className="space-y-2">
                            <Label>LinkedIn URL</Label>
                            <div className="relative">
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-10" value={linkedin_url} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/..." />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Expertise / Skills (Comma separated)</Label>
                        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="React, UI Design, Marketing" />
                    </div>

                    <div className="space-y-2">
                        <Label>Short Biography</Label>
                        <Textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Briefly describe the mentor's background..."
                            className="min-h-[120px]"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-border/40">
                        <Button variant="hero" disabled={busy || uploading} onClick={onSave} className="px-8">
                            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {editing ? "Update Mentor" : "Create Mentor"}
                        </Button>
                        <Button variant="soft" disabled={busy} onClick={resetForm}>
                            Cancel
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List Card - Matching BlogsAdmin style */}
            <Card className="rounded-3xl border border-border/60 bg-card/25 shadow-elev">
                <CardHeader>
                    <CardTitle className="text-xl font-extrabold flex items-center justify-between">
                        Active Mentors
                        <Button variant="ghost" size="sm" onClick={loadMentors} disabled={loading}>Refresh</Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>
                        ) : mentors.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground italic">No mentors found.</div>
                        ) : (
                            mentors.map((m) => (
                                <div key={m.id} className="group relative flex items-center gap-4 p-4 rounded-2xl border border-border/70 bg-background/20 transition-all hover:bg-background/40">
                                    <div className="h-16 w-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/40">
                                        {m.image_path ? (
                                            <img src={m.image_path} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-primary font-black text-xl bg-primary/10">
                                                {m.initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="font-bold truncate text-base">{m.name}</div>
                                        <div className="text-xs text-primary font-bold uppercase tracking-wider">{m.title}</div>
                                        <div className="mt-1 text-[10px] text-muted-foreground flex items-center gap-2">
                                            {m.tags?.slice(0, 3).join(" • ")}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => onEdit(m)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-500/10" onClick={() => onDelete(m.id)}>
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

function UsersIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}
