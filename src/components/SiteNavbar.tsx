import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/components/auth/useIsAdmin";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Phone, Shield, Sparkles, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLogo } from "@/hooks/useLogo";

const navItems = [
  { to: "/courses", label: "Courses" },
  { to: "/mentors", label: "Mentors" },
  { to: "/#library", label: "Resources" },
  { to: "/projects", label: "Projects" },
  { to: "/career", label: "Career" },
  { to: "/blog", label: "Blog" },
  { to: "/contact-us", label: "Contact" },
];

export function SiteNavbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState("+8801912895591");
  const [isScrolled, setIsScrolled] = useState(false);
  const { logoUrl, isLoading } = useLogo();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchPhone = async () => {
      const { data } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "contact_phone")
        .single();
      if (data?.value) setContactPhone(data.value);
    };
    fetchPhone();
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        isScrolled
          ? "border-b border-border/80 bg-background/90 backdrop-blur-md shadow-sm"
          : "border-b border-border/40 bg-background/60 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <NavLink to="/" className="flex items-center gap-3">
            {isLoading ? (
              // Placeholder while loading to prevent layout shift & flash
              <div className="h-16 w-32" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-9 sm:h-11 md:h-12 max-w-[160px] sm:max-w-[200px] object-contain"
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
              />
            ) : (
              <>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-elev">
                  <span className="text-sm font-black tracking-tight text-primary-foreground">IM</span>
                </div>
                <div className="text-base font-semibold tracking-tight">
                  Industry<span className="text-primary">Mentor</span>
                </div>
              </>
            )}
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeClassName="text-foreground"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`tel:${contactPhone}`}
            className="group relative flex items-center gap-2 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:border-emerald-400/70 hover:bg-emerald-500/20 hover:shadow-[0_0_18px_rgba(16,185,129,0.35)]"
            title="Direct Call Hotline"
          >
            <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
              {/* Expanding ring wave ripple */}
              <span className="animate-ring-wave bg-emerald-400/40" />
              <span className="absolute -inset-0.5 rounded-full bg-emerald-400/20 blur-xs animate-pulse" />
              {/* Ringing phone icon */}
              <Phone className="relative h-3.5 w-3.5 text-emerald-400 animate-phone-ring" />
            </span>
            <span className="hidden sm:inline tabular-nums font-semibold tracking-tight text-xs sm:text-sm text-foreground group-hover:text-emerald-300 transition-colors">
              {contactPhone}
            </span>
          </a>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="soft" size="sm" asChild>
                    <NavLink to="/admin">
                      <Shield className="h-4 w-4" />
                      Admin
                    </NavLink>
                  </Button>
                )}
                <Button variant="soft" size="sm" asChild>
                  <NavLink to="/dashboard">
                    <Sparkles className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                </Button>
                <Button variant="soft" size="sm" asChild>
                  <NavLink to="/portfolio">
                    <User className="h-4 w-4" />
                    Portfolio
                  </NavLink>
                </Button>
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    void signOut();
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="soft" size="sm" asChild>
                <NavLink to={{ pathname: "/auth", search: "?mode=login" }}>
                  <Sparkles className="h-4 w-4" />
                  Sign In
                </NavLink>
              </Button>
            )}

            <Button variant="hero" size="sm" asChild>
              <NavLink to={{ pathname: "/auth", search: "?mode=signup" }} state={{ from: "/dashboard" }}>
                <Sparkles className="h-4 w-4" />
                Start Learning
              </NavLink>
            </Button>
          </div>

          {/* Mobile Menu & Quick Actions */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <div className="hidden sm:block">
              <Button variant="hero" size="sm" className="h-8 px-3 text-xs font-medium" asChild>
                <NavLink to={{ pathname: "/auth", search: "?mode=signup" }} state={{ from: "/dashboard" }}>
                  Start Learning
                </NavLink>
              </Button>
            </div>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-border/70 bg-card/60">
                  <Menu className="h-5 w-5 text-foreground" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] max-w-[320px] border-l border-border/40 bg-background/95 backdrop-blur-xl">
                <SheetTitle className="text-left text-lg font-bold mb-6">Navigation</SheetTitle>
                <nav className="flex flex-col gap-4">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
                      activeClassName="text-primary font-bold"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <div className="my-4 border-t border-border/40 pt-4">
                    {user ? (
                      <div className="flex flex-col gap-3">
                        {isAdmin && (
                          <Button variant="soft" className="justify-start" asChild onClick={() => setIsOpen(false)}>
                            <NavLink to="/admin">
                              <Shield className="mr-2 h-4 w-4" />
                              Admin Panel
                            </NavLink>
                          </Button>
                        )}
                        <Button variant="soft" className="justify-start" asChild onClick={() => setIsOpen(false)}>
                          <NavLink to="/dashboard">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Dashboard
                          </NavLink>
                        </Button>
                        <Button variant="soft" className="justify-start" asChild onClick={() => setIsOpen(false)}>
                          <NavLink to="/portfolio">
                            <User className="mr-2 h-4 w-4" />
                            Portfolio
                          </NavLink>
                        </Button>
                        <Button
                          variant="ghost"
                          className="justify-start text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            void signOut();
                            setIsOpen(false);
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Logout
                        </Button>
                      </div>
                    ) : (
                      <Button variant="soft" className="w-full justify-start" asChild onClick={() => setIsOpen(false)}>
                        <NavLink to={{ pathname: "/auth", search: "?mode=login" }}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Sign In
                        </NavLink>
                      </Button>
                    )}
                  </div>
                  <a
                    href={`tel:${contactPhone}`}
                    className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-foreground shadow-sm transition-colors hover:bg-emerald-500/15"
                  >
                    <span className="relative flex h-5 w-5 items-center justify-center shrink-0">
                      <span className="animate-ring-wave bg-emerald-400/40" />
                      <Phone className="relative h-4 w-4 text-emerald-400 animate-phone-ring" />
                    </span>
                    <span className="font-semibold">Call Support</span>
                    <span className="ml-auto tabular-nums font-bold text-emerald-400">{contactPhone}</span>
                  </a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden sm:flex md:hidden">
            {/* Optional: Add a tablet-specific menu if needed, but the above covers sm+ */}
          </div>
        </div>
      </div>
    </header>
  );
}

