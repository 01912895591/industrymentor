import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const routePrefetchMap: Record<string, () => Promise<unknown>> = {
  "/courses": () => import("@/pages/Courses"),
  "/mentors": () => import("@/pages/Mentors"),
  "/projects": () => import("@/pages/Projects"),
  "/career": () => import("@/pages/Career"),
  "/blog": () => import("@/pages/Blogs"),
  "/contact-us": () => import("@/pages/Contact"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/verify": () => import("@/pages/VerifyCertificate"),
  "/privacy-policy": () => import("@/pages/PrivacyPolicy"),
  "/terms-of-service": () => import("@/pages/TermsOfService"),
  "/refund-policy": () => import("@/pages/RefundPolicy"),
};

const prefetchRoute = (to: unknown) => {
  if (typeof to === "string") {
    const cleanPath = to.split("?")[0].split("#")[0];
    if (cleanPath && routePrefetchMap[cleanPath]) {
      routePrefetchMap[cleanPath]().catch(() => {});
    }
  } else if (to && typeof to === "object" && "pathname" in to && typeof (to as any).pathname === "string") {
    const cleanPath = (to as any).pathname;
    if (cleanPath && routePrefetchMap[cleanPath]) {
      routePrefetchMap[cleanPath]().catch(() => {});
    }
  }
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onTouchStart, ...props }, ref) => {
    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      prefetchRoute(to);
      onMouseEnter?.(e);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLAnchorElement>) => {
      prefetchRoute(to);
      onTouchStart?.(e);
    };

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleTouchStart}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink, prefetchRoute };
