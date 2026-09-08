import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const profileSchema = z.object({
    full_name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
    phone: z.string().trim().min(5, "Phone number is too short").max(20).optional().or(z.literal("")),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional().or(z.literal("")),
    location: z.string().max(100, "Location is too long").optional().or(z.literal("")),
    avatar_url: z.string().optional().or(z.literal("")),
});

type ProfileValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
    userId: string;
    initialData: Partial<ProfileValues>;
    onSuccess: () => void;
}

export function ProfileEditForm({ userId, initialData, onSuccess }: ProfileEditFormProps) {
    const [loading, setLoading] = useState(false);

    const form = useForm<ProfileValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: initialData.full_name || "",
            phone: initialData.phone || "",
            bio: initialData.bio || "",
            location: initialData.location || "",
            avatar_url: initialData.avatar_url || "",
        },
    });

    const [avatarPreview, setAvatarPreview] = useState<string>(initialData.avatar_url || "");
    const [uploading, setUploading] = useState(false);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) return;
            setUploading(true);
            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `avatar-${userId}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Use site_assets bucket as per existing mentors implementation
            const { error: uploadError } = await (supabase.storage
                .from("site_assets" as any) as any)
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = (supabase.storage
                .from("site_assets" as any) as any)
                .getPublicUrl(filePath);

            setAvatarPreview(publicUrl);
            form.setValue("avatar_url", publicUrl);
            toast({ title: "Profile picture uploaded" });
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        } finally {
            setUploading(false);
        }
    };

    const onSubmit = async (values: ProfileValues) => {
        setLoading(true);
        try {
            // Prepare update payload
            const updateData: any = {
                full_name: values.full_name,
                phone: values.phone,
                bio: values.bio,
                location: values.location,
                updated_at: new Date().toISOString(),
            };

            // Only include avatar_url if it's actually been set/changed to avoid schema errors if column is missing
            if (values.avatar_url) {
                updateData.avatar_url = values.avatar_url;
            }

            const { error } = await (supabase as any)
                .from("profiles")
                .update(updateData)
                .eq("user_id", userId);

            if (error) {
                // If it's a "column not found" error, try updating without the advanced fields
                if (error.message?.includes("column") && error.message?.includes("not found")) {
                    console.warn("Schema mismatch detected, attempting simplified update...", error.message);

                    const simplifiedData = {
                        full_name: values.full_name,
                        updated_at: new Date().toISOString(),
                    };

                    const { error: retryError } = await (supabase as any)
                        .from("profiles")
                        .update(simplifiedData)
                        .eq("user_id", userId);

                    if (retryError) throw retryError;

                    toast({
                        title: "Partial update successful",
                        description: "Some fields (like Avatar/Bio) couldn't be saved because the database columns are missing. Please run the SQL fix in Supabase.",
                        variant: "default"
                    });
                } else {
                    throw error;
                }
            } else {
                toast({ title: "Profile updated", description: "Your changes have been saved successfully." });
            }

            onSuccess();
        } catch (err: any) {
            console.error("Error updating profile:", err);
            toast({
                title: "Update failed",
                description: err.message || "Failed to save profile changes.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4 pb-6 border-b border-border/20">
                <Label htmlFor="avatar-upload" className="cursor-pointer group relative">
                    <div className="h-24 w-24 rounded-full border-2 border-primary/20 p-1 transition-all group-hover:border-primary">
                        <div className="h-full w-full rounded-full overflow-hidden bg-muted relative">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                                    <span className="text-2xl font-bold">{form.getValues("full_name")?.[0] || "?"}</span>
                                </div>
                            )}
                            {uploading && (
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 shadow-elev opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></svg>
                    </div>
                    <Input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
                </Label>
                <div className="text-center">
                    <p className="text-sm font-bold">Profile Picture</p>
                    <p className="text-[10px] text-muted-foreground">Tap to upload your photo</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input id="full_name" placeholder="John Doe" {...form.register("full_name")} />
                    {form.formState.errors.full_name && (
                        <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="+8801..." {...form.register("phone")} />
                    {form.formState.errors.phone && (
                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" placeholder="Dhaka, Bangladesh" {...form.register("location")} />
                    {form.formState.errors.location && (
                        <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                        id="bio"
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px] resize-none"
                        {...form.register("bio")}
                    />
                    {form.formState.errors.bio && (
                        <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
