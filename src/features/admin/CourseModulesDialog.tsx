import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type Module = {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    price_cents: number;
    created_at: string;
};

interface CourseModulesDialogProps {
    courseId: string;
    courseTitle: string;
}

export function CourseModulesDialog({ courseId, courseTitle }: CourseModulesDialogProps) {
    const [open, setOpen] = useState(false);
    const [modules, setModules] = useState<Module[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    const loadModules = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase
                .from("course_modules" as any)
                .select("*")
                .eq("course_id", courseId)
                .order("created_at", { ascending: true })) as any;

            if (error) throw error;
            setModules(data || []);
        } catch (error: any) {
            console.error("Error loading modules:", error);
            toast.error("Failed to load modules");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            loadModules();
        }
    }, [open, courseId]);

    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setDescription("");
        setPrice("");
    };

    const startEdit = (module: Module) => {
        setEditingId(module.id);
        setTitle(module.title);
        setDescription(module.description || "");
        setPrice((module.price_cents / 100).toString());
    };

    const handleSave = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        setSaving(true);
        try {
            const priceCents = Math.max(0, Math.round((parseFloat(price) || 0) * 100));

            if (editingId) {
                // Update
                const { error } = await (supabase
                    .from("course_modules" as any)
                    .update({
                        title,
                        description: description || null,
                        price_cents: priceCents,
                    })
                    .eq("id", editingId)) as any;

                if (error) throw error;
                toast.success("Module updated");
            } else {
                // Create
                const { error } = await (supabase
                    .from("course_modules" as any)
                    .insert({
                        course_id: courseId,
                        title,
                        description: description || null,
                        price_cents: priceCents,
                    })) as any;

                if (error) throw error;
                toast.success("Module added");
            }

            resetForm();
            loadModules();
        } catch (error: any) {
            console.error("Error saving module:", error);
            toast.error(error.message || "Failed to save module");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this module?")) return;

        try {
            const { error } = await (supabase
                .from("course_modules" as any)
                .delete()
                .eq("id", id)) as any;

            if (error) throw error;
            toast.success("Module deleted");
            loadModules();
        } catch (error: any) {
            toast.error("Failed to delete module");
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Modules
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Modules: {courseTitle}</DialogTitle>
                    <DialogDescription>
                        Add, edit, or remove modules for this course.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Form */}
                    <div className="rounded-lg border bg-card/50 p-4 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="col-span-2 sm:col-span-1">
                                <Label htmlFor="modTitle">Module Title</Label>
                                <Input
                                    id="modTitle"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Introduction to Fabrics"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <Label htmlFor="modPrice">Price (BDT, Optional)</Label>
                                <Input
                                    id="modPrice"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                            <div className="col-span-2">
                                <Label htmlFor="modDesc">Description</Label>
                                <Textarea
                                    id="modDesc"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief description of what this module covers..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingId && (
                                <Button variant="ghost" size="sm" onClick={resetForm}>Cancel</Button>
                            )}
                            <Button size="sm" onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editingId ? "Update Module" : "Add Module"}
                            </Button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-foreground/80">Existing Modules</h3>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : modules.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                No modules added yet.
                            </div>
                        ) : (
                            modules.map((mod) => (
                                <div key={mod.id} className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-3 rounded-lg border bg-card/30 hover:bg-card/50 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm truncate">{mod.title}</h4>
                                            {mod.price_cents > 0 && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                                    ৳{mod.price_cents / 100}
                                                </span>
                                            )}
                                        </div>
                                        {mod.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{mod.description}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(mod)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(mod.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
