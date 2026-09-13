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
import type { CareerPathRow } from "@/hooks/useCareer";

interface CareerPathDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  careerPath: CareerPathRow | null; // null for Create, CareerPathRow for Edit
  existingPaths: CareerPathRow[];
  onSuccess: () => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const AVAILABLE_ICONS = [
  { value: "Briefcase", label: "Briefcase (Merchandising / Management)" },
  { value: "Factory", label: "Factory (Industrial / Production)" },
  { value: "ShieldCheck", label: "ShieldCheck (Quality / Compliance)" },
  { value: "Layers", label: "Layers (Cross-functional / Systems)" },
  { value: "Compass", label: "Compass (Exploration / Operations)" },
  { value: "Award", label: "Award (Executive / Excellence)" },
];

export function CareerPathDialog({
  open,
  onOpenChange,
  careerPath,
  existingPaths,
  onSuccess,
}: CareerPathDialogProps) {
  const isEditing = Boolean(careerPath);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [domain, setDomain] = useState("");
  const [description, setDescription] = useState("");
  const [practicalScope, setPracticalScope] = useState("");
  const [iconName, setIconName] = useState("Briefcase");
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (careerPath) {
      setTitle(careerPath.title);
      setSlug(careerPath.slug);
      setDomain(careerPath.domain);
      setDescription(careerPath.description);
      setPracticalScope(careerPath.practical_scope || "");
      setIconName(careerPath.icon_name || "Briefcase");
      setOrderIndex(careerPath.order_index);
      setIsPublished(careerPath.is_published);
    } else {
      setTitle("");
      setSlug("");
      setDomain("");
      setDescription("");
      setPracticalScope("");
      setIconName("Briefcase");
      const nextOrder = existingPaths.length > 0 ? Math.max(...existingPaths.map((p) => p.order_index)) + 1 : 1;
      setOrderIndex(nextOrder);
      setIsPublished(true);
    }
    setErrors({});
  }, [careerPath, existingPaths, open]);

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
      const duplicate = existingPaths.find(
        (p) => p.slug === cleanSlug && (!isEditing || p.id !== careerPath?.id)
      );
      if (duplicate) {
        newErrors.slug = `Slug "${cleanSlug}" is already in use by another career path`;
      }
    }

    if (orderIndex < 0) {
      newErrors.orderIndex = "Order index must be 0 or greater";
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
        practical_scope: practicalScope.trim() || null,
        icon_name: iconName,
        order_index: Number(orderIndex),
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && careerPath) {
        const { error } = await supabase
          .from("career_paths")
          .update(payload)
          .eq("id", careerPath.id);

        if (error) throw error;
        toast({
          title: "Career Path Updated",
          description: `Successfully updated "${payload.title}".`,
        });
      } else {
        const { error } = await supabase.from("career_paths").insert([payload]);

        if (error) throw error;
        toast({
          title: "Career Path Created",
          description: `Successfully created "${payload.title}".`,
        });
      }

      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error("Save career path error:", err);
      toast({
        title: "Save Failed",
        description: err.message || "An unexpected error occurred while saving the career path.",
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
            {isEditing ? "Edit Career Pathway" : "Create New Career Pathway"}
          </DialogTitle>
          <DialogDescription>
            Configure the vocational pathway track, practical floor scope, and display order.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-title" className="text-xs font-semibold">
              Pathway Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cp-title"
              value={title}
              onChange={handleTitleChange}
              placeholder="e.g. Garment Merchandising & Supply Execution"
              className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="cp-slug" className="text-xs font-semibold">
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
              id="cp-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. garment-merchandising-supply-execution"
              className={errors.slug ? "border-destructive focus-visible:ring-destructive font-mono text-xs" : "font-mono text-xs"}
            />
            {errors.slug && <p className="text-xs text-destructive">{errors.slug}</p>}
          </div>

          {/* Domain & Icon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cp-domain" className="text-xs font-semibold">
                Domain / Department <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cp-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Merchandising, Industrial Engineering"
                className={errors.domain ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              {errors.domain && <p className="text-xs text-destructive">{errors.domain}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cp-icon" className="text-xs font-semibold">
                Display Icon
              </Label>
              <Select value={iconName} onValueChange={setIconName}>
                <SelectTrigger id="cp-icon">
                  <SelectValue placeholder="Select icon" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-description" className="text-xs font-semibold">
              Pathway Overview Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="cp-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="High-level vocational summary describing the career trajectory..."
              className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Practical Scope */}
          <div className="space-y-1.5">
            <Label htmlFor="cp-scope" className="text-xs font-semibold">
              Practical Floor Scope (Execution Details)
            </Label>
            <Textarea
              id="cp-scope"
              rows={2}
              value={practicalScope}
              onChange={(e) => setPracticalScope(e.target.value)}
              placeholder="Specific manufacturing floor activities (e.g. TNA management, line balancing studies)..."
            />
          </div>

          {/* Order & Published State */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/40">
            <div className="space-y-1.5">
              <Label htmlFor="cp-order" className="text-xs font-semibold">
                Display Order Index
              </Label>
              <Input
                id="cp-order"
                type="number"
                min={0}
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value, 10) || 0)}
                className={errors.orderIndex ? "border-destructive" : ""}
              />
              {errors.orderIndex && <p className="text-xs text-destructive">{errors.orderIndex}</p>}
            </div>

            <div className="flex flex-col justify-center space-y-1.5 pt-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cp-published" className="text-xs font-semibold cursor-pointer">
                  Publish to Student Catalog
                </Label>
                <Switch
                  id="cp-published"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isPublished ? "Visible on public /career page" : "Saved as draft, hidden from public"}
              </p>
            </div>
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
              {isEditing ? "Save Changes" : "Create Pathway"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
