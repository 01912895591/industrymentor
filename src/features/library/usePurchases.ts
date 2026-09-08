import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export type PurchaseRow = {
  id: string;
  user_id: string;
  item_type: string;
  item_key: string;
  title: string;
  amount_cents: number;
  created_at: string;
};

export function usePurchases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["purchases", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("purchases")
        .select("id,user_id,item_type,item_key,title,amount_cents,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PurchaseRow[];
    },
  });
}
