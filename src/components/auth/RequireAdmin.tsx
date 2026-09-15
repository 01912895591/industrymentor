import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      setIsAdmin(false);
      return;
    }

    let alive = true;
    setChecking(true);

    (supabase as any)
      .rpc("has_role", { _user_id: user.id, _role: "admin" })
      .then(({ data, error }: any) => {
        if (!alive) return;
        if (error) {
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data));
        }
      })
      .finally(() => {
        if (!alive) return;
        setChecking(false);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  if (loading || checking) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-xl border border-border/60 bg-card/25 p-8 shadow-sm">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return children;
}
