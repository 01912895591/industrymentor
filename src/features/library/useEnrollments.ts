import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useEnrollments() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["enrollments", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await (supabase as any)
                .from("course_enrollments")
                .select(`
          *,
          courses:course_id (
            id,
            title,
            slug,
            description,
            cover_image_path
          )
        `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}
