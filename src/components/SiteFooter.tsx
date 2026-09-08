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

      const { data: mapData } = await (supabase
        .from("site_settings" as any)
        .select("value")
        .eq("key", "office_map_url")
        .single()) as any;

      setLocation({
        address: locData?.value || "",
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

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3 md:grid-cols-4">
            <div className="space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Office Location
              </div>
              <div className="text-muted-foreground leading-relaxed">
                {location.address || "Add address in admin settings"}
                {location.mapUrl && (
                  <div className="mt-4">
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
                        className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        View on Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Explore</div>
              <div className="flex flex-col gap-1 text-muted-foreground">
                <NavLink to="/courses" className="hover:text-foreground">Courses</NavLink>
                <NavLink to="/blog" className="hover:text-foreground">Blog</NavLink>
                <NavLink to="/#library" className="hover:text-foreground">Library</NavLink>
                <NavLink to="/#mentors" className="hover:text-foreground">Mentors</NavLink>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Company</div>
              <div className="flex flex-col gap-1 text-muted-foreground">
                <NavLink to="/contact-us" className="hover:text-foreground">Contact</NavLink>
                <NavLink to="/dashboard" className="hover:text-foreground">Dashboard</NavLink>
              </div>
            </div>
            <div className="space-y-2">
              <div className="font-semibold">Legal</div>
              <div className="flex flex-col gap-1 text-muted-foreground">
                <a href="#" className="hover:text-foreground">Privacy</a>
                <a href="#" className="hover:text-foreground">Terms</a>
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
