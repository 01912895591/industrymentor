import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export function useCertificates() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["certificates", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await (supabase as any)
                .from("certificates")
                .select("id, course_id, status, issued_at, certificate_path, courses:course_id(id, title, slug)")
                .eq("user_id", user.id);

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}
