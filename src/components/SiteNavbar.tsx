import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/components/auth/useIsAdmin";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Phone, Shield, Sparkles, User, LayoutDashboard } from "lucide-react";
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
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      e.preventDefault();
      if (location.hash) {
        navigate("/", { replace: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

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
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <NavLink to="/" onClick={handleLogoClick} className="flex items-center gap-3 shrink-0">
            {isLoading ? (
              // Placeholder while loading to prevent layout shift & flash
              <div className="h-16 w-32" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-9 sm:h-11 md:h-12 max-w-[150px] sm:max-w-[190px] object-contain"
                loading="eager"
                // @ts-ignore
                fetchPriority="high"
              />
            ) : (
              <>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-brand shadow-sm">
                  <span className="text-sm font-black tracking-tight text-primary-foreground">IM</span>
                </div>
                <div className="text-base font-semibold tracking-tight">
                  Industry<span className="text-primary">Mentor</span>
                </div>
              </>
            )}
          </NavLink>

          <nav className="hidden items-center gap-0.5 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="px-2.5 py-1.5 text-xs lg:text-sm lg:px-3 lg:py-2 text-muted-foreground transition-colors hover:text-foreground rounded-md"
                activeClassName="text-foreground font-semibold"
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <a
            href={`tel:${contactPhone}`}
            className="group relative flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-foreground shadow-sm transition-all duration-200 hover:border-emerald-400/60 hover:bg-emerald-500/15"
            title="Direct Call Hotline"
          >
            <span className="relative flex h-4 w-4 items-center justify-center shrink-0">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
            </span>
            <span className="hidden sm:inline tabular-nums font-semibold tracking-tight text-xs sm:text-sm text-foreground group-hover:text-emerald-300 transition-colors">
              {contactPhone}
            </span>
          </a>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                {isAdmin && (
                  <Button variant="soft" size="sm" asChild className="h-9 gap-1.5 font-medium">
                    <NavLink to="/admin">
                      <Shield className="h-3.5 w-3.5" />
                      Admin
                    </NavLink>
                  </Button>
                )}
                <Button variant="default" size="sm" asChild className="h-9 gap-1.5 font-semibold shadow-sm">
                  <NavLink to="/dashboard">
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </NavLink>
                </Button>
                <Button variant="soft" size="sm" asChild className="h-9 gap-1.5 font-medium">
                  <NavLink to="/portfolio">
                    <User className="h-3.5 w-3.5" />
                    Portfolio
                  </NavLink>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    void signOut();
                  }}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="soft" size="sm" asChild className="h-9">
                  <NavLink to={{ pathname: "/auth", search: "?mode=login" }}>
                    Sign In
                  </NavLink>
                </Button>
                <Button variant="hero" size="sm" asChild className="h-9">
                  <NavLink to={{ pathname: "/auth", search: "?mode=signup" }} state={{ from: "/dashboard" }}>
                    <Sparkles className="h-3.5 w-3.5" />
                    Start Learning
                  </NavLink>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu & Quick Actions */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            {!user && (
              <div className="hidden sm:block">
                <Button variant="hero" size="sm" className="h-8 px-3 text-xs font-medium" asChild>
                  <NavLink to={{ pathname: "/auth", search: "?mode=signup" }} state={{ from: "/dashboard" }}>
                    Start Learning
                  </NavLink>
                </Button>
              </div>
            )}

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
                        <Button variant="default" className="justify-start font-semibold shadow-sm" asChild onClick={() => setIsOpen(false)}>
                          <NavLink to="/dashboard">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
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

