import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsAdmin } from "@/components/auth/useIsAdmin";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, Phone, Shield, Sparkles } from "lucide-react";
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
  { to: "/", label: "Home" },
  { to: "/#courses", label: "Courses" },
  { to: "/#library", label: "Library" },
  { to: "/#mentors", label: "Mentors" },
  { to: "/blog", label: "Blog" },
  { to: "/contact-us", label: "Contact" },
];

export function SiteNavbar() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [isOpen, setIsOpen] = useState(false);
  const [contactPhone, setContactPhone] = useState("+8801912895591");
  const { logoUrl, isLoading } = useLogo();

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
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-3">
            {isLoading ? (
              // Placeholder while loading to prevent layout shift & flash
              <div className="h-16 w-32" />
            ) : logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-12 xs:h-14 sm:h-16 object-contain"
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

        <div className="flex items-center gap-2">
          <a
            href={`tel:${contactPhone}`}
            className="hidden items-center gap-2 rounded-full border border-border/70 bg-card/40 px-3 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:text-foreground lg:flex"
          >
            <Phone className="h-4 w-4 text-primary" />
            <span className="tabular-nums">{contactPhone}</span>
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
                Get Started
              </NavLink>
            </Button>
          </div>

          {/* Mobile Menu & Quick Actions */}
          <div className="flex items-center gap-1 sm:gap-2 md:hidden">
            <Button variant="hero" size="sm" className="h-8 px-2 text-[10px] xs:h-9 xs:px-3 xs:text-xs sm:h-10 sm:px-4 sm:text-sm" asChild>
              <NavLink to={{ pathname: "/auth", search: "?mode=signup" }} state={{ from: "/dashboard" }}>
                Get Started
              </NavLink>
            </Button>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                  <Menu className="h-5 w-5" />
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
                    href="tel:+8801912895591"
                    className="flex items-center gap-2 rounded-xl bg-card p-4 text-sm text-muted-foreground shadow-sm"
                  >
                    <Phone className="h-4 w-4 text-primary" />
                    <span>Call Support</span>
                    <span className="ml-auto tabular-nums">+8801912895591</span>
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

