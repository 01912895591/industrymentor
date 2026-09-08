import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteNavbar } from "@/components/SiteNavbar";
import { SiteFooter } from "@/components/SiteFooter";

export function SiteLayout() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (!el) return;

      // Wait for the target section to render.
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
      return;
    }

    // Default route navigation should reset to the top (e.g. clicking "Home").
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.hash, location.pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteNavbar />
      <Outlet />
      <SiteFooter />
    </div>
  );
}
