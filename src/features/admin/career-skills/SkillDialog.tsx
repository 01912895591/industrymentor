import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Wand2 } from "lucide-react";
import type { SkillRow } from "@/hooks/useCareer";

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: SkillRow | null; // null for Create, SkillRow for Edit
  existingSkills: SkillRow[];
  onSuccess: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const DIFFICULTY_OPTIONS: Array<"Foundational" | "Intermediate" | "Advanced"> = [
  "Foundational",
  "Intermediate",
  "Advanced",
];

export function SkillDialog({
  open,
  onOpenChange,
  skill,
  existingSkills,
  onSuccess,
}: SkillDialogProps) {
  const isEditing = Boolean(skill);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [practicalApplication, setPracticalApplication] = useState("");
  const [difficulty, setDifficulty] = useState<"Foundational" | "Intermediate" | "Advanced">("Intermediate");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (skill) {
      setTitle(skill.title);
      setSlug(skill.slug);
      setDomain(skill.domain);
      setDescription(skill.description);
      setPracticalApplication(skill.practical_application || "");
      setDifficulty((skill.difficulty as any) || "Intermediate");
      setIsPublished(skill.is_published);
    } else {
      setTitle("");
      setSlug("");
      setDomain("");
      setDescription("");
      setPracticalApplication("");
      setDifficulty("Foundational");
      setIsPublished(true);
    }
    setErrors({});
  }, [skill, existingSkills, open]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    if (!isEditing && (!slug || slug === slugify(title))) {
      setSlug(slugify(val));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = "Title is required";
    if (!domain.trim()) newErrors.domain = "Domain is required";
    if (!description.trim()) newErrors.description = "Description is required";

    const cleanSlug = slug.trim();
    if (!cleanSlug) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
      newErrors.slug = "Slug must contain only lowercase letters, numbers, and hyphens";
    } else {
      const duplicate = existingSkills.find(
        (s) => s.slug === cleanSlug && (!isEditing || s.id !== skill?.id)
      );
      if (duplicate) {
        newErrors.slug = `Slug "${cleanSlug}" is already in use by another skill`;
      }
    }

    if (!difficulty) {
      newErrors.difficulty = "Difficulty is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        domain: domain.trim(),
        description: description.trim(),
        practical_application: practicalApplication.trim() || null,
        difficulty: difficulty,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && skill) {
        const { error } = await supabase
          .from("skills")
          .update(payload)
          .eq("id", skill.id);

        if (error) throw error;
        toast({
          title: "Skill Updated",
          description: `Successfully updated "${payload.title}".`,
        });
      } else {
        const { error } = await supabase.from("skills").insert([payload]);

        if (error) throw error;
        toast({
          title: "Skill Created",
          description: `Successfully added "${payload.title}".`,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Save skill error:", err);
      toast({
        title: "Save Failed",
        description: err.message || "An unexpected error occurred while saving the skill.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto border-border/80 bg-background">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "Edit Skill" : "Add New Skill"}
          </DialogTitle>
          <DialogDescription>
            Register a teachable manufacturing floor competency, difficulty tier, and practical application.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="skill-title" className="text-xs font-semibold">
              Skill Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="skill-title"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Standard Minute Value (SMV) & Line Balancing"
              className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="skill-slug" className="text-xs font-semibold">
                URL Slug <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground px-1.5"
                onClick={() => setSlug(slugify(title))}
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Auto-generate
              </Button>
            </div>
            <Input
              id="skill-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. smv-line-balancing"
              className={errors.slug ? "border-destructive focus-visible:ring-destructive font-mono text-xs" : "font-mono text-xs"}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
          </div>

          {/* Domain & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="skill-domain" className="text-xs font-semibold">
                Domain / Area <span className="text-destructive">*</span>
              </Label>
              <Input
                id="skill-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Industrial Engineering, Quality Assurance"
                className={errors.domain ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.domain && <p className="text-xs text-destructive">{errors.domain}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skill-diff" className="text-xs font-semibold">
                Standard Difficulty <span className="text-destructive">*</span>
              </Label>
              <Select value={difficulty} onValueChange={(val: any) => setDifficulty(val)}>
                <SelectTrigger id="skill-diff">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.difficulty && <p className="text-xs text-destructive">{errors.difficulty}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="skill-desc" className="text-xs font-semibold">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="skill-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Theoretical knowledge and standard industry definition..."
              className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Practical Application */}
          <div className="space-y-1.5">
            <Label htmlFor="skill-practical" className="text-xs font-semibold">
              Practical Factory Floor Application
            </Label>
            <Textarea
              id="skill-practical"
              rows={2}
              value={practicalApplication}
              onChange={(e) => setPracticalApplication(e.target.value)}
              placeholder="How an engineer, merchandiser, or QA auditor executes this on the line..."
            />
          </div>

          {/* Published State */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 bg-muted/20">
            <div>
              <Label htmlFor="skill-published" className="text-xs font-semibold cursor-pointer">
                Publish in Skill Catalog
              </Label>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isPublished ? "Visible in student skills catalog" : "Draft state, hidden from students"}
              </p>
            </div>
            <Switch
              id="skill-published"
              checked={isPublished}
              onCheckedChange={setIsPublished}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Add Skill"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
