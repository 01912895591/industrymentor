import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export function useProfile() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["profile", user?.id],
        queryFn: async () => {
            if (!user) return null;
            const { data, error } = await (supabase as any)
                .from("profiles")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (error) throw error;
            return data;
        },
        enabled: !!user,
    });
}
