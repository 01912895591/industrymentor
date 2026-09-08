import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

export function useNotifications() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await (supabase as any)
                .from("notifications")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data || [];
        },
        enabled: !!user,
    });
}
