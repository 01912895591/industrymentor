import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  ShieldCheck,
  Briefcase,
  ArrowRight,
  Globe,
  Lock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useCreatePortfolio, isValidSlug, generateSafeSlug } from "@/hooks/usePortfolio";
import { useCareerPaths } from "@/hooks/useCareer";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioOnboardingProps {
  onCreated?: (slug: string) => void;
}

export function PortfolioOnboarding({ onCreated }: PortfolioOnboardingProps) {
  const { user } = useAuth();
  const createMutation = useCreatePortfolio();
  const { data: careerPaths = [] } = useCareerPaths();

  const [slug, setSlug] = useState(() => generateSafeSlug(user?.email));
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [careerPathId, setCareerPathId] = useState<string>("none");
  const [location, setLocation] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSlug = slug.trim().toLowerCase();

    if (!isValidSlug(cleanSlug)) {
      toast.error(
        "Slug must be between 3 and 60 lowercase alphanumeric characters and hyphens."
      );
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        slug: cleanSlug,
        headline: headline.trim() || undefined,
        bio: bio.trim() || undefined,
        career_path_id: careerPathId === "none" ? undefined : careerPathId,
        location: location.trim() || undefined,
      });

      toast.success("Portfolio created! Your portfolio is initialized as Private.");
      onCreated?.(created.slug);
    } catch (err: any) {
      toast.error(err?.message || "Failed to create portfolio");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="bg-card/40 backdrop-blur-2xl border-border/70 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8 bg-gradient-to-b from-primary/10 via-transparent to-transparent border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Initialize Your Industry Portfolio
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Showcase mentor-approved industry projects and verified course credentials in a professional profile.
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8">
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Slug */}
            <div className="space-y-1.5">
              <Label htmlFor="slug" className="text-xs font-semibold text-foreground">
                Custom Portfolio URL Slug *
              </Label>
              <div className="flex rounded-lg border border-border/60 bg-background/60 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted/40 border-r border-border/60 font-mono">
                  /portfolio/
                </span>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="your-name-or-handle"
                  className="border-0 focus-visible:ring-0 text-xs font-mono h-9 bg-transparent"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Only lowercase letters, numbers, and hyphens. Example: <code>farhan-ahmed</code>
              </p>
            </div>

            {/* Headline */}
            <div className="space-y-1.5">
              <Label htmlFor="headline" className="text-xs font-semibold text-foreground">
                Professional Headline (Optional)
              </Label>
              <Input
                id="headline"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Garment Merchandiser | Supply Chain Execution & Critical Path Management"
                maxLength={100}
                className="h-9 text-xs bg-background/60"
              />
            </div>

            {/* Career Track */}
            {careerPaths.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Primary Career Pathway (Optional)
                </Label>
                <Select value={careerPathId} onValueChange={setCareerPathId}>
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Select your target career track" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None Selected</SelectItem>
                    {careerPaths.map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.title} ({cp.domain})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold text-foreground">
                Location (Optional)
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Dhaka, Bangladesh"
                className="h-9 text-xs bg-background/60"
              />
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-semibold text-foreground">
                Professional Summary / Bio (Optional)
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Briefly describe your practical background, industrial competencies, and production specialties..."
                rows={3}
                maxLength={1000}
                className="text-xs bg-background/60"
              />
            </div>

            {/* Privacy Notice */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Privacy Guaranteed:</strong> Your portfolio is initialized as <strong>Private</strong>. Only you can view it until you explicitly choose to switch visibility to Public.
              </span>
            </div>

            <Button
              type="submit"
              disabled={createMutation.isPending || !slug.trim()}
              className="w-full h-10 text-xs font-bold gap-2"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              <span>Create My Portfolio</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
