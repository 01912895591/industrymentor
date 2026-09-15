import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload, Trash2, Plus, Facebook, Linkedin, Instagram, Youtube, MessageCircleQuestion, Video, Pin, MapPin, AlertTriangle } from "lucide-react";

function isLinkedInAdminUrl(url: string) {
    return /linkedin\.com\/(?:company-admin|admin|feed|dashboard)/i.test(url);
}

export function SettingsAdmin() {
    const [uploading, setUploading] = useState(false);
    // currentHeroImages will store array of URLs
    const [currentHeroImages, setCurrentHeroImages] = useState<string[]>([]);
    const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
    const [newSocialLink, setNewSocialLink] = useState({ platform: "Facebook", url: "" });
    const [isAddingLink, setIsAddingLink] = useState(false);
    const [locationSettings, setLocationSettings] = useState({ address: "", mapUrl: "" });
    const [isSavingLocation, setIsSavingLocation] = useState(false);

    const socialPlatforms = [
        { name: "Facebook", icon: Facebook },
        { name: "LinkedIn", icon: Linkedin },
        { name: "Pinterest", icon: Pin },
        { name: "TikTok", icon: Video },
        { name: "YouTube", icon: Youtube },
        { name: "Instagram", icon: Instagram },
        { name: "Quora", icon: MessageCircleQuestion },
    ];

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await (supabase
                .from("site_settings" as any)
                .select("value")
                .eq("key", "hero_image_url")
                .single()) as any;

            if (error && error.code !== "PGRST116") {
                console.error("Error fetching settings:", error);
                return;
            }

            if (data?.value) {
                // Handle legacy string or new array
                if (Array.isArray(data.value)) {
                    setCurrentHeroImages(data.value);
                } else if (typeof data.value === 'string') {
                    setCurrentHeroImages([data.value]);
                }
            }

            // Fetch Social Links
            const { data: socialData } = await supabase
                .from("site_settings" as any)
                .select("value")
                .eq("key", "social_links")
                .single() as any;

            if (socialData?.value && Array.isArray(socialData.value)) {
                setSocialLinks(socialData.value);
            }

            // Fetch Location Settings
            const { data: locData } = await supabase
                .from("site_settings" as any)
                .select("value")
                .eq("key", "office_location")
                .single() as any;

            const { data: mapData } = await supabase
                .from("site_settings" as any)
                .select("value")
                .eq("key", "office_map_url")
                .single() as any;

            setLocationSettings({
                address: locData?.value || "",
                mapUrl: mapData?.value || ""
            });
        } catch (error) {
            console.error("Error parsing settings:", error);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            setUploading(true);
            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `hero-image-${Date.now()}.${fileExt}`;
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

            // 3. Update State first
            const newImages = [...currentHeroImages, publicUrl];
            setCurrentHeroImages(newImages);

            // 4. Update Database
            await updateSettingsInDb(newImages);

            toast.success("Image added to slider successfully");

            // Reset input
            event.target.value = "";

        } catch (error: any) {
            console.error("Error uploading image:", error);
            if (error.message === "Bucket not found") {
                toast.error("Storage bucket 'site_assets' not found.");
            } else {
                toast.error(error.message || "Failed to upload image");
            }
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveImage = async (indexToRemove: number) => {
        try {
            const newImages = currentHeroImages.filter((_, index) => index !== indexToRemove);
            setCurrentHeroImages(newImages);
            await updateSettingsInDb(newImages);
            toast.success("Image removed from slider");
        } catch (error: any) {
            toast.error("Failed to remove image");
        }
    };

    const updateSettingsInDb = async (images: string[]) => {
        const { error: dbError } = await (supabase
            .from("site_settings" as any)
            .upsert({
                key: "hero_image_url",
                value: images
            }, { onConflict: "key" })) as any;

        if (dbError) throw dbError;
    }

    const handleAddSocialLink = async () => {
        if (!newSocialLink.url) {
            toast.error("Please enter a URL");
            return;
        }

        setIsAddingLink(true);
        try {
            const newLinks = [...socialLinks, newSocialLink];

            const { error } = await supabase
                .from("site_settings" as any)
                .upsert({
                    key: "social_links",
                    value: newLinks
                }, { onConflict: "key" }) as any;

            if (error) throw error;

            setSocialLinks(newLinks);
            setNewSocialLink({ platform: "Facebook", url: "" });
            toast.success("Social link added");
        } catch (error) {
            console.error("Error saving social link:", error);
            toast.error("Failed to save social link");
        } finally {
            setIsAddingLink(false);
        }
    };

    const handleDeleteSocialLink = async (index: number) => {
        try {
            const newLinks = socialLinks.filter((_, i) => i !== index);

            const { error } = await supabase
                .from("site_settings" as any)
                .upsert({
                    key: "social_links",
                    value: newLinks
                }, { onConflict: "key" }) as any;

            if (error) throw error;

            setSocialLinks(newLinks);
            toast.success("Social link removed");
        } catch (error) {
            toast.error("Failed to remove link");
        }
    };

    const handleSaveLocation = async () => {
        setIsSavingLocation(true);
        try {
            const { error: locError } = await supabase
                .from("site_settings" as any)
                .upsert({
                    key: "office_location",
                    value: locationSettings.address
                }, { onConflict: "key" }) as any;

            if (locError) throw locError;

            const { error: mapError } = await supabase
                .from("site_settings" as any)
                .upsert({
                    key: "office_map_url",
                    value: locationSettings.mapUrl
                }, { onConflict: "key" }) as any;

            if (mapError) throw mapError;

            toast.success("Location settings updated");
        } catch (error) {
            console.error("Error saving location:", error);
            toast.error("Failed to save location settings");
        } finally {
            setIsSavingLocation(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage platform settings and configuration.</p>
                </div>
            </div>

            <Card className="rounded-xl border border-border/60 bg-card/40 shadow-xs">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Hero Section Slider</CardTitle>
                    <CardDescription>
                        Manage the images displayed in the homepage hero slider. Add multiple images to enable sliding.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Button asChild disabled={uploading}>
                                <Label htmlFor="hero-image-upload" className="cursor-pointer">
                                    {uploading ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                    )}
                                    Add New Slide Image
                                    <Input
                                        id="hero-image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </Label>
                            </Button>
                            <p className="text-sm text-muted-foreground">
                                Recommended Size: 1280x800px (16:10 Ratio)
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                            {currentHeroImages.length === 0 && (
                                <div className="col-span-full text-center py-10 border-2 border-dashed rounded-lg text-muted-foreground">
                                    No images uploaded. Default image will be shown.
                                </div>
                            )}

                            {currentHeroImages.map((imgUrl, index) => (
                                <div key={index} className="group relative aspect-[16/10] overflow-hidden rounded-xl border bg-muted shadow-xs hover:shadow-sm transition-all">
                                    <img
                                        src={imgUrl}
                                        alt={`Slide ${index + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform flex justify-between items-center">
                                        <span className="text-white text-xs font-medium">Slide {index + 1}</span>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => handleRemoveImage(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 bg-card/40 shadow-xs">
                <CardHeader>
                    <CardTitle className="text-xl font-bold">Social Media Links</CardTitle>
                    <CardDescription>
                        Manage social media links displayed in the footer.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="w-full sm:w-1/3">
                                <Label className="mb-2 block text-xs font-bold uppercase tracking-wider opacity-70">Platform</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={newSocialLink.platform}
                                    onChange={(e) => setNewSocialLink({ ...newSocialLink, platform: e.target.value })}
                                >
                                    {socialPlatforms.map((p) => (
                                        <option key={p.name} value={p.name}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-full sm:w-1/2">
                                <Label className="mb-2 block text-xs font-bold uppercase tracking-wider opacity-70">URL</Label>
                                <Input
                                    placeholder="https://..."
                                    value={newSocialLink.url}
                                    onChange={(e) => setNewSocialLink({ ...newSocialLink, url: e.target.value })}
                                    className="h-10 text-xs"
                                />
                            </div>
                            <Button onClick={handleAddSocialLink} disabled={isAddingLink} className="h-10">
                                {isAddingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                <span className="ml-2 font-bold text-xs">Add</span>
                            </Button>
                        </div>
                        {newSocialLink.platform === "LinkedIn" && isLinkedInAdminUrl(newSocialLink.url) && (
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>Note: This URL appears to be an internal LinkedIn management page. For public visitors, use your public company page URL (e.g., <code>linkedin.com/company/industrymentor</code>).</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3 mt-4">
                        {socialLinks.map((link, index) => {
                            const platform = socialPlatforms.find(p => p.name === link.platform) || socialPlatforms[0];
                            const Icon = platform.icon;
                            const hasAdminUrl = link.platform === "LinkedIn" && isLinkedInAdminUrl(link.url);

                            return (
                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 border border-border/60 rounded-xl bg-background/20 gap-3">
                                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                                        <div className="p-2 bg-muted rounded-full shrink-0">
                                            <Icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-sm">{link.platform}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[240px] sm:max-w-md" title={link.url}>
                                                {link.url}
                                            </div>
                                            {hasAdminUrl && (
                                                <div className="text-[11px] text-amber-500 flex items-center gap-1 mt-1">
                                                    <AlertTriangle className="h-3 w-3 shrink-0" />
                                                    <span>Admin URL detected — consider using public company URL for visitors.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-auto" onClick={() => handleDeleteSocialLink(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                        {socialLinks.length === 0 && (
                            <div className="text-center py-6 text-muted-foreground text-xs italic">
                                No social links added yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-xl border border-border/60 bg-card/40 shadow-xs">
                <CardHeader>
                    <CardTitle>Office Location & Map</CardTitle>
                    <CardDescription>
                        Manage your office address and Google Maps embed URL.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="office-address">Office Address</Label>
                            <Input
                                id="office-address"
                                placeholder="Enter your office address..."
                                value={locationSettings.address}
                                onChange={(e) => setLocationSettings({ ...locationSettings, address: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="map-url">Google Maps Embed URL</Label>
                            <Input
                                id="map-url"
                                placeholder="Paste Google Maps embed URL (src content from iframe)..."
                                value={locationSettings.mapUrl}
                                onChange={(e) => setLocationSettings({ ...locationSettings, mapUrl: e.target.value })}
                                className={cn(
                                    locationSettings.mapUrl && !locationSettings.mapUrl.includes("google.com/maps/embed") && "border-yellow-500/50"
                                )}
                            />
                            {locationSettings.mapUrl && !locationSettings.mapUrl.includes("google.com/maps/embed") && (
                                <p className="text-[10px] text-yellow-500 font-medium">
                                    Note: This looks like a share link. It will show as a "View Map" button instead of an embedded map.
                                </p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                                To get an <strong>Embedded Map</strong>: Go to Google Maps &gt; Share &gt; Embed a map &gt; Copy the URL inside the 'src' attribute.
                            </p>
                        </div>
                        <Button
                            onClick={handleSaveLocation}
                            disabled={isSavingLocation}
                            className="w-full sm:w-auto"
                        >
                            {isSavingLocation ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Upload className="mr-2 h-4 w-4" />
                            )}
                            Save Location Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
