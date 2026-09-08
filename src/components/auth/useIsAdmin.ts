import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);

    (supabase as any)
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }: any) => {
        if (!alive) return;
        setIsAdmin(!error && Boolean(data));
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  return { isAdmin, loading };
}
