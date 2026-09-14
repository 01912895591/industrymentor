import { NavLink } from "@/components/NavLink";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Facebook, Linkedin, Instagram, Youtube, Globe, MessageCircleQuestion, Video, Pin, MapPin } from "lucide-react";

export function SiteFooter() {
  const [contactPhone, setContactPhone] = useState("+8801912895591");
  const [socialLinks, setSocialLinks] = useState<{ platform: string; url: string }[]>([]);
  const [location, setLocation] = useState({ address: "", mapUrl: "" });

  useEffect(() => {
    const fetchPhone = async () => {
      const { data } = await (supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "contact_phone")
        .single()) as any;
      if (data?.value) setContactPhone(data.value);

      const { data: socialData } = await supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "social_links")
        .single() as any;

      if (socialData?.value && Array.isArray(socialData.value)) {
        setSocialLinks(socialData.value);
      }

      const { data: locData } = await (supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "office_location")
        .single()) as any;

      const { data: contactAddrData } = await (supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "contact_address")
        .single()) as any;

      const rawAddr = locData?.value || contactAddrData?.value || "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh";
      const cleanAddr = rawAddr
        ? rawAddr
            .replace(/Bandladesh/gi, "Bangladesh")
            .replace(/^25\/2\s*\.?\s*salimuddin market road,\s*mirpur-1,\s*dhaka,\s*bangladesh/i, "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh")
        : "25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh";

      const { data: mapData } = await (supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "office_map_url")
        .single()) as any;

      setLocation({
        address: cleanAddr,
        mapUrl: mapData?.value || ""
      });
    };
    fetchPhone();
  }, []);

  return (
    <footer className="border-t border-border/60 bg-background/50">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row">
          <div className="max-w-md">
            <div className="text-base xs:text-lg font-bold tracking-tight">
              About <span className="text-primary">Us</span>
            </div>
            <p className="mt-3 text-xs xs:text-sm leading-relaxed text-muted-foreground">
              IndustryMentor is a premium e-learning platform dedicated to bridging the gap between students and industry experts. We provide curated courses, SOPs, and mentorship to help you scale your skills and career.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((link, idx) => {
                let Icon = Globe;
                if (link.platform === "Facebook") Icon = Facebook;
                else if (link.platform === "LinkedIn") Icon = Linkedin;
                else if (link.platform === "Instagram") Icon = Instagram;
                else if (link.platform === "YouTube") Icon = Youtube;
                else if (link.platform === "TikTok") Icon = Video;
                else if (link.platform === "Quora") Icon = MessageCircleQuestion;
                else if (link.platform === "Pinterest") Icon = Pin;

                return (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-xs sm:text-sm sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4">
            {/* 1. Platform */}
            <div className="space-y-2.5">
              <div className="font-semibold text-foreground tracking-tight">Platform</div>
              <div className="flex flex-col gap-1.5 text-muted-foreground">
                <NavLink to="/courses" className="hover:text-foreground transition-colors">Courses</NavLink>
                <NavLink to="/mentors" className="hover:text-foreground transition-colors">Mentors</NavLink>
                <NavLink to="/#library" className="hover:text-foreground transition-colors">Resources &amp; SOPs</NavLink>
                <NavLink to="/projects" className="hover:text-foreground transition-colors">Projects</NavLink>
                <NavLink to="/career" className="hover:text-foreground transition-colors">Career Pathway</NavLink>
              </div>
            </div>

            {/* 2. Company */}
            <div className="space-y-2.5">
              <div className="font-semibold text-foreground tracking-tight">Company</div>
              <div className="flex flex-col gap-1.5 text-muted-foreground">
                <NavLink to="/contact-us" className="hover:text-foreground transition-colors">About Us</NavLink>
                <NavLink to="/contact-us" className="hover:text-foreground transition-colors">Contact Us</NavLink>
                <NavLink to="/blog" className="hover:text-foreground transition-colors">Blog &amp; Insights</NavLink>
              </div>
            </div>

            {/* 3. Account & Verification */}
            <div className="space-y-2.5">
              <div className="font-semibold text-foreground tracking-tight">Account &amp; Security</div>
              <div className="flex flex-col gap-1.5 text-muted-foreground">
                <NavLink to="/auth?mode=login" className="hover:text-foreground transition-colors">Student Login</NavLink>
                <NavLink to="/auth?mode=signup" className="hover:text-foreground transition-colors">Register Account</NavLink>
                <NavLink to="/dashboard" className="hover:text-foreground transition-colors">Student Dashboard</NavLink>
                <NavLink to="/verify" className="hover:text-foreground transition-colors">Verify Certificate</NavLink>
              </div>
            </div>

            {/* 4. Office & Location */}
            <div className="space-y-2.5">
              <div className="font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Office Location
              </div>
              <div className="text-muted-foreground leading-relaxed text-xs">
                {location.address || "Contact support for office appointments"}
                {location.mapUrl && (
                  <div className="mt-3">
                    {location.mapUrl.includes("google.com/maps/embed") ? (
                      <div className="overflow-hidden rounded-lg border border-border/60 shadow-sm aspect-video">
                        <iframe
                          src={location.mapUrl}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          title="Office Location Map"
                        ></iframe>
                      </div>
                    ) : (
                      <a
                        href={location.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md bg-card/60 border border-border/60 px-2.5 py-1.5 text-xs text-primary hover:text-foreground transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        View Map
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} IndustryMentor. All rights reserved.</div>
          <div className="tabular-nums">Support: {contactPhone}</div>
        </div>
      </div>
    </footer>
  );
}
