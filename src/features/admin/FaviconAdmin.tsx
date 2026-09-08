import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, RefreshCw, Image as ImageIcon } from "lucide-react";

export function FaviconAdmin() {
    const { toast } = useToast();
    const [currentFavicon, setCurrentFavicon] = useState<string | null>(null);
    const [currentLogo, setCurrentLogo] = useState<string | null>(null);
    const [uploadingFavicon, setUploadingFavicon] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [deletingFavicon, setDeletingFavicon] = useState(false);
    const [deletingLogo, setDeletingLogo] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch current settings
    const fetchSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await (supabase as any).rpc("get_site_settings");
            if (error) throw error;
            setCurrentFavicon(data?.favicon_url || null);
            setCurrentLogo(data?.logo_url || null);
        } catch (err: any) {
            toast({ title: "Failed to load settings", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    // Handle favicon upload
    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/x-icon", "image/png", "image/jpeg", "image/svg+xml"];
        if (!validTypes.includes(file.type)) {
            toast({ title: "Invalid file type", description: "Please upload .ico, .png, .jpg, or .svg", variant: "destructive" });
            return;
        }

        if (file.size > 500 * 1024) {
            toast({ title: "File too large", description: "Max size is 500KB", variant: "destructive" });
            return;
        }

        setUploadingFavicon(true);
        try {
            if (currentFavicon) {
                const oldPath = currentFavicon.split("/site-assets/")[1];
                if (oldPath) await supabase.storage.from("site-assets").remove([oldPath]);
            }

            const fileExt = file.name.split(".").pop();
            const fileName = `favicon-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("site-assets").upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
            const { error: updateError } = await (supabase as any).rpc("update_favicon", { icon_url: urlData.publicUrl });
            if (updateError) throw updateError;

            setCurrentFavicon(urlData.publicUrl);
            toast({ title: "Favicon updated", description: "Your new favicon is now live!" });
            window.dispatchEvent(new CustomEvent("favicon-updated"));
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
            setUploadingFavicon(false);
            e.target.value = "";
        }
    };

    // Handle logo upload
    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"];
        if (!validTypes.includes(file.type)) {
            toast({ title: "Invalid file type", description: "Please upload .png, .jpg, .svg, or .webp", variant: "destructive" });
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast({ title: "File too large", description: "Max size is 2MB", variant: "destructive" });
            return;
        }

        setUploadingLogo(true);
        try {
            if (currentLogo) {
                const oldPath = currentLogo.split("/site-assets/")[1];
                if (oldPath) await supabase.storage.from("site-assets").remove([oldPath]);
            }

            const fileExt = file.name.split(".").pop();
            const fileName = `logo-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from("site-assets").upload(fileName, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
            const { error: updateError } = await (supabase as any).rpc("update_logo", { new_logo_url: urlData.publicUrl });
            if (updateError) throw updateError;

            setCurrentLogo(urlData.publicUrl);
            toast({ title: "Logo updated", description: "Your new logo is now live!" });
            window.dispatchEvent(new CustomEvent("logo-updated"));
        } catch (err: any) {
            toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        } finally {
            setUploadingLogo(false);
            e.target.value = "";
        }
    };

    // Handle favicon delete
    const handleDeleteFavicon = async () => {
        if (!currentFavicon || !confirm("Remove current favicon?")) return;
        setDeletingFavicon(true);
        try {
            const filePath = currentFavicon.split("/site-assets/")[1];
            if (filePath) await supabase.storage.from("site-assets").remove([filePath]);
            const { error } = await (supabase as any).rpc("update_favicon", { icon_url: null });
            if (error) throw error;
            setCurrentFavicon(null);
            toast({ title: "Favicon removed" });
            window.dispatchEvent(new CustomEvent("favicon-updated"));
        } catch (err: any) {
            toast({ title: "Delete failed", description: err.message, variant: "destructive" });
        } finally {
            setDeletingFavicon(false);
        }
    };

    // Handle logo delete
    const handleDeleteLogo = async () => {
        if (!currentLogo || !confirm("Remove current logo?")) return;
        setDeletingLogo(true);
        try {
            const filePath = currentLogo.split("/site-assets/")[1];
            if (filePath) await supabase.storage.from("site-assets").remove([filePath]);
            const { error } = await (supabase as any).rpc("update_logo", { new_logo_url: null });
            if (error) throw error;
            setCurrentLogo(null);
            toast({ title: "Logo removed" });
            window.dispatchEvent(new CustomEvent("logo-updated"));
        } catch (err: any) {
            toast({ title: "Delete failed", description: err.message, variant: "destructive" });
        } finally {
            setDeletingLogo(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Site Branding</h1>
                <p className="text-muted-foreground mt-1">
                    Upload and manage your site's logo and favicon
                </p>
            </div>

            {/* Logo Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card/25 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <ImageIcon className="h-5 w-5" />
                        Site Logo
                    </h2>

                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : currentLogo ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center rounded-lg border border-border/40 bg-background/50 p-8">
                                <img src={currentLogo} alt="Site Logo" className="max-h-24 max-w-full object-contain" />
                            </div>
                            <div className="text-xs text-muted-foreground break-all">{currentLogo}</div>
                            <Button variant="destructive" size="sm" onClick={handleDeleteLogo} disabled={deletingLogo} className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingLogo ? "Removing..." : "Remove Logo"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border/40 bg-background/30">
                            <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">No logo set</p>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-border/60 bg-card/25 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Upload className="h-5 w-5" />
                        Upload New Logo
                    </h2>

                    <div className="space-y-4">
                        <div className="rounded-lg border border-dashed border-border/40 bg-background/30 p-6 text-center">
                            <Input id="logo-upload" type="file" accept=".png,.jpg,.jpeg,.svg,.webp" onChange={handleLogoUpload} disabled={uploadingLogo} className="hidden" />
                            <label htmlFor="logo-upload" className={`flex cursor-pointer flex-col items-center gap-2 ${uploadingLogo ? "opacity-50" : ""}`}>
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium">{uploadingLogo ? "Uploading..." : "Click to upload"}</span>
                                <span className="text-xs text-muted-foreground">.png, .jpg, .svg, .webp (max 2MB)</span>
                            </label>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground">
                            <p className="font-semibold mb-2">Tips:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Transparent PNG works best</li>
                                <li>Recommended height: 40-60px</li>
                                <li>SVG for crisp scaling</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Favicon Section */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-border/60 bg-card/25 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <ImageIcon className="h-5 w-5" />
                        Favicon
                    </h2>

                    {loading ? (
                        <div className="flex h-32 items-center justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : currentFavicon ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center rounded-lg border border-border/40 bg-background/50 p-8">
                                <img src={currentFavicon} alt="Favicon" className="h-16 w-16" />
                            </div>
                            <div className="text-xs text-muted-foreground break-all">{currentFavicon}</div>
                            <Button variant="destructive" size="sm" onClick={handleDeleteFavicon} disabled={deletingFavicon} className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingFavicon ? "Removing..." : "Remove Favicon"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border/40 bg-background/30">
                            <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">No favicon set</p>
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-border/60 bg-card/25 p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Upload className="h-5 w-5" />
                        Upload New Favicon
                    </h2>

                    <div className="space-y-4">
                        <div className="rounded-lg border border-dashed border-border/40 bg-background/30 p-6 text-center">
                            <Input id="favicon-upload" type="file" accept=".ico,.png,.jpg,.jpeg,.svg" onChange={handleFaviconUpload} disabled={uploadingFavicon} className="hidden" />
                            <label htmlFor="favicon-upload" className={`flex cursor-pointer flex-col items-center gap-2 ${uploadingFavicon ? "opacity-50" : ""}`}>
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm font-medium">{uploadingFavicon ? "Uploading..." : "Click to upload"}</span>
                                <span className="text-xs text-muted-foreground">.ico, .png, .jpg, .svg (max 500KB)</span>
                            </label>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-xs text-muted-foreground">
                            <p className="font-semibold mb-2">Tips:</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>32x32 or 64x64 pixels</li>
                                <li>.ico format for best compatibility</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
