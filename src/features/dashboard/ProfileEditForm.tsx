import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
    const queryClient = useQueryClient();

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

    // Synchronize form values whenever initialData changes (e.g. after async profile fetch)
    useEffect(() => {
        form.reset({
            full_name: initialData.full_name || "",
            phone: initialData.phone || "",
            bio: initialData.bio || "",
            location: initialData.location || "",
            avatar_url: initialData.avatar_url || "",
        });
        setAvatarPreview(initialData.avatar_url || "");
    }, [initialData, form]);

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
            // Prepare upsert payload: ensures row is created if absent, or updated if present
            const payload: any = {
                user_id: userId,
                full_name: values.full_name.trim(),
                phone: values.phone?.trim() || null,
                bio: values.bio?.trim() || null,
                location: values.location?.trim() || null,
                avatar_url: values.avatar_url || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await (supabase as any)
                .from("profiles")
                .upsert(payload, { onConflict: "user_id" });

            if (error) {
                // If it's a "column not found" error, fallback to core fields
                if (error.message?.includes("column") && error.message?.includes("not found")) {
                    console.warn("Schema mismatch detected, attempting simplified upsert...", error.message);

                    const simplifiedData = {
                        user_id: userId,
                        full_name: values.full_name.trim(),
                        updated_at: new Date().toISOString(),
                    };

                    const { error: retryError } = await (supabase as any)
                        .from("profiles")
                        .upsert(simplifiedData, { onConflict: "user_id" });

                    if (retryError) throw retryError;

                    toast({
                        title: "Partial update successful",
                        description: "Core profile saved. Some additional fields couldn't be saved due to column configuration.",
                        variant: "default"
                    });
                } else {
                    throw error;
                }
            } else {
                toast({ title: "Profile updated", description: "Your changes have been saved successfully." });
            }

            // Sync user_metadata in auth so Auth session immediately reflects new name
            try {
                await supabase.auth.updateUser({
                    data: {
                        full_name: values.full_name.trim(),
                        name: values.full_name.trim(),
                    },
                });
            } catch (authErr) {
                console.warn("Could not sync user_metadata in auth:", authErr);
            }

            // Invalidate profile queries across the application
            await queryClient.invalidateQueries({ queryKey: ["profile"] });

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
                <div className="text-center space-y-1">
                    <p className="text-sm font-bold text-foreground">Profile Photo</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Upload a clear headshot to personalize your student profile and certificates.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-xs font-semibold text-foreground">Full Name</Label>
                    <Input id="full_name" placeholder="e.g. Abdullah Al Mamun" className="h-10 rounded-lg" {...form.register("full_name")} />
                    {form.formState.errors.full_name && (
                        <p className="text-xs text-destructive">{form.formState.errors.full_name.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-semibold text-foreground">Phone Number</Label>
                    <Input id="phone" type="tel" placeholder="e.g. +880 1912-345678" className="h-10 rounded-lg" {...form.register("phone")} />
                    {form.formState.errors.phone && (
                        <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="location" className="text-xs font-semibold text-foreground">Location</Label>
                    <Input id="location" placeholder="e.g. Dhaka, Bangladesh" className="h-10 rounded-lg" {...form.register("location")} />
                    {form.formState.errors.location && (
                        <p className="text-xs text-destructive">{form.formState.errors.location.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="bio" className="text-xs font-semibold text-foreground">Professional Bio / Summary</Label>
                    <Textarea
                        id="bio"
                        placeholder="Brief summary of your academic background or current role in apparel & textile manufacturing..."
                        className="min-h-[100px] resize-none rounded-lg text-xs sm:text-sm leading-relaxed"
                        {...form.register("bio")}
                    />
                    {form.formState.errors.bio && (
                        <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="submit" variant="default" disabled={loading} className="w-full sm:w-auto font-semibold">
                    {loading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    );
}
