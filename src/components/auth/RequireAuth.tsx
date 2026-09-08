import { useAuth } from "@/components/auth/AuthProvider";
import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border/60 bg-card/25 p-8 shadow-elev">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return children;
}
