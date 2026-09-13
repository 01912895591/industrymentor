import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Globe,
  Lock,
  Linkedin,
  Save,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { useUpdatePortfolio, isValidSlug } from "@/hooks/usePortfolio";
import { useCareerPaths } from "@/hooks/useCareer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PortfolioWithDetails } from "@/types/portfolio";

interface PortfolioProfileTabProps {
  portfolio: PortfolioWithDetails;
}

export function PortfolioProfileTab({ portfolio }: PortfolioProfileTabProps) {
  const updateMutation = useUpdatePortfolio();
  const { data: careerPaths = [] } = useCareerPaths();

  const [slug, setSlug] = useState(portfolio.slug);
  const [headline, setHeadline] = useState(portfolio.headline || "");
  const [bio, setBio] = useState(portfolio.bio || "");
  const [careerPathId, setCareerPathId] = useState<string>(
    portfolio.career_path_id || "none"
  );
  const [location, setLocation] = useState(portfolio.location || "");
  const [linkedinUrl, setLinkedinUrl] = useState(portfolio.linkedin_url || "");
  const [isPublic, setIsPublic] = useState(portfolio.is_public);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanSlug = slug.trim().toLowerCase();
    if (!isValidSlug(cleanSlug)) {
      toast.error(
        "Slug must be between 3 and 60 lowercase alphanumeric characters and hyphens."
      );
      return;
    }

    if (linkedinUrl && linkedinUrl.trim()) {
      const trimmed = linkedinUrl.trim();
      if (!/^https?:\/\/[^\s]+$/i.test(trimmed) || /^(javascript|data|file):/i.test(trimmed)) {
        toast.error("LinkedIn URL must be a valid HTTPS link.");
        return;
      }
    }

    try {
      await updateMutation.mutateAsync({
        portfolioId: portfolio.id,
        formData: {
          slug: cleanSlug,
          headline: headline.trim(),
          bio: bio.trim(),
          career_path_id: careerPathId === "none" ? null : careerPathId,
          location: location.trim(),
          linkedin_url: linkedinUrl.trim(),
          is_public: isPublic,
        },
      });

      toast.success("Portfolio settings updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update portfolio");
    }
  };

  return (
    <Card className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-2xl shadow-sm">
      <CardHeader className="border-b border-border/40 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-foreground">
              Portfolio Profile & Visibility
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Customize your public introduction, target industrial domain, and profile privacy.
            </CardDescription>
          </div>

          {/* Visibility Indicator */}
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                isPublic
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {isPublic ? (
                <>
                  <Globe className="h-3.5 w-3.5" />
                  <span>Publicly Visible</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" />
                  <span>Private Profile</span>
                </>
              )}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Privacy Toggle Section */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                {isPublic ? (
                  <Globe className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-amber-400" />
                )}
                <span>Portfolio Visibility Status</span>
              </div>
              <p className="text-xs text-muted-foreground max-w-lg">
                {isPublic
                  ? "Your portfolio is Public. Anyone with the URL can inspect your verified projects and certificates."
                  : "Your portfolio is Private. Only you (and administrators) can access it. Public visitors see a private notice."}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Label htmlFor="visibility-toggle" className="text-xs font-semibold cursor-pointer">
                {isPublic ? "Public" : "Private"}
              </Label>
              <Switch
                id="visibility-toggle"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Slug */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="slug-input" className="text-xs font-semibold text-foreground">
                Custom Portfolio URL Slug *
              </Label>
              <div className="flex rounded-lg border border-border/60 bg-background/60 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                <span className="inline-flex items-center px-3 text-xs text-muted-foreground bg-muted/40 border-r border-border/60 font-mono">
                  {typeof window !== "undefined" ? window.location.origin : ""}/portfolio/
                </span>
                <Input
                  id="slug-input"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  placeholder="your-custom-slug"
                  className="border-0 focus-visible:ring-0 text-xs font-mono h-9 bg-transparent"
                  required
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Must be 3–60 lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {/* Headline */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="headline-input" className="text-xs font-semibold text-foreground">
                Professional Headline
              </Label>
              <Input
                id="headline-input"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g., Garment Merchandiser | Supply Chain & TNA Execution Specialist"
                maxLength={100}
                className="h-9 text-xs bg-background/60"
              />
              <span className="text-[10px] text-muted-foreground/80 float-right">
                {headline.length}/100
              </span>
            </div>

            {/* Career Track */}
            {careerPaths.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">
                  Target Career Pathway
                </Label>
                <Select value={careerPathId} onValueChange={setCareerPathId}>
                  <SelectTrigger className="h-9 text-xs bg-background/60">
                    <SelectValue placeholder="Select career track" />
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
              <Label htmlFor="location-input" className="text-xs font-semibold text-foreground">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  id="location-input"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Dhaka, Bangladesh"
                  className="pl-9 h-9 text-xs bg-background/60"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="linkedin-input" className="text-xs font-semibold text-foreground">
                LinkedIn Profile URL
              </Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-blue-400" />
                <Input
                  id="linkedin-input"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/yourprofile"
                  className="pl-9 h-9 text-xs bg-background/60"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Must begin with https:// (optional)
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="bio-input" className="text-xs font-semibold text-foreground">
                Professional Bio / Summary
              </Label>
              <Textarea
                id="bio-input"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share your practical industrial journey, factory production interests, and analytical competencies..."
                rows={4}
                maxLength={1000}
                className="text-xs bg-background/60"
              />
              <span className="text-[10px] text-muted-foreground/80 float-right">
                {bio.length}/1000
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-border/40 flex justify-end">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="h-9 text-xs font-bold gap-1.5"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              <span>Save Profile Changes</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
