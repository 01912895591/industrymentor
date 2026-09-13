import { Button } from "@/components/ui/button";
import defaultHeroImage from "@/assets/hero-garment.jpg";
import courseReact from "@/assets/course-react.jpg";
import courseDesign from "@/assets/course-design.jpg";
import { ChevronLeft, ChevronRight, ArrowRight, Users, FileText, ShieldCheck, MessageSquare, BookOpen } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export function HeroSection() {
  const [heroImages, setHeroImages] = useState<string[]>([
    defaultHeroImage,
    courseReact,
    courseDesign,
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const autoplay = useRef(
    Autoplay({
      delay: 3500,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
    })
  );

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      duration: 30,
    },
    [autoplay.current]
  );

  const scrollPrev = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollPrev();
    autoplay.current.reset();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (!emblaApi) return;
    emblaApi.scrollNext();
    autoplay.current.reset();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const { data, error } = await (supabase
          .from("site_settings" as any)
          .select("value")
          .eq("key", "hero_image_url")
          .single()) as any;

        if (data?.value) {
          let imgs: string[] = [];
          if (Array.isArray(data.value) && data.value.length > 0) {
            imgs = data.value;
          } else if (typeof data.value === "string") {
            imgs = [data.value];
          }

          // Prioritize the Garment Quality Inspector banner (matching the user's primary choice) as the first slide
          const sorted = [...imgs].sort((a, b) => {
            if (a.includes("1772869711635")) return -1;
            if (b.includes("1772869711635")) return 1;
            return 0;
          });

          setHeroImages(sorted);
        }
      } catch (error) {
        console.error("Error fetching hero images:", error);
      }
    };

    fetchHeroImages();
  }, []);

  // Re-initialize Embla & reset autoplay whenever heroImages are fetched/updated
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit();
    autoplay.current.reset();
  }, [emblaApi, heroImages]);

  return (
    <section className="relative overflow-hidden py-4 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-6 px-4 sm:gap-8 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8 w-full">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            INDUSTRY-LED LEARNING
          </div>

          <div className="relative">
            {/* Ambient soft glow aura behind headline */}
            <div
              className="pointer-events-none absolute -top-8 -left-6 -z-10 h-44 w-72 sm:w-96 rounded-full bg-primary/15 blur-3xl opacity-60"
              aria-hidden="true"
            />

            <h1 className="mt-3 text-3xl xs:text-4xl sm:text-4xl lg:text-[2.6rem] xl:text-5xl font-black tracking-tight leading-[1.15]">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent inline-block">
                Learn From Industry.
              </span>{" "}
              <span className="hero-gradient-text inline-block">
                Build Real Skills.
              </span>{" "}
              <span className="hero-shimmer-text inline-block">
                Move Your Career Forward.
              </span>
            </h1>
          </div>

          <p className="mt-3 max-w-xl text-pretty text-xs xs:text-sm sm:text-base leading-relaxed text-muted-foreground">
            IndustryMentor bridges the gap between academic theory and real-world industrial execution. Master garment merchandising, industrial engineering, and factory operations with practitioner-led training, 1:1 expert mentorship, and verifiable credentials.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3 sm:mt-6">
            <Button
              variant="hero"
              size="default"
              asChild
              className="group px-5 sm:px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md"
            >
              <NavLink to="/courses">
                Explore Courses
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </NavLink>
            </Button>

            <Button
              variant="outline"
              size="default"
              asChild
              className="group px-4.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold border-border/80 bg-card/40 backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-card/70 hover:shadow-[0_0_20px_-3px_rgba(56,189,248,0.25)]"
            >
              <NavLink to="/#library">
                <BookOpen className="mr-2 h-4 w-4 text-primary transition-transform duration-200 group-hover:scale-110" />
                Explore Library
              </NavLink>
            </Button>

            <Button
              variant="outline"
              size="default"
              asChild
              className="group px-4 sm:px-4.5 py-2.5 text-xs sm:text-sm font-semibold border-border/70 bg-card/25 backdrop-blur-md transition-all duration-200 hover:border-border-active hover:bg-card/60 hover:text-foreground hover:shadow-sm"
            >
              <NavLink to="/contact-us">
                <MessageSquare className="mr-2 h-4 w-4 text-primary/90 transition-transform duration-200 group-hover:scale-110" />
                Contact Us
              </NavLink>
            </Button>
          </div>

          {/* Practical Highlights */}
          <div className="mt-5 flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-muted-foreground border-t border-border/40 pt-4">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Practitioner-Led</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Real Production SOPs</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Verifiable Certificates</span>
            </div>
          </div>
        </div>

        <div className="relative group/slider w-full max-w-lg lg:max-w-none mx-auto">
          <div className="relative overflow-hidden rounded-xl border border-border/75 bg-card/40 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-primary/40">
            {/* Top technical badge */}
            <div className="absolute top-3 left-3 z-20 rounded-md border border-border/60 bg-background/85 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur-md shadow-sm">
              Practical Training &amp; Floor Execution
            </div>

            <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
              <div className="flex">
                {heroImages.map((src, index) => (
                  <div className="flex-[0_0_100%] min-w-0" key={index}>
                    <img
                      src={src}
                      alt={`Course banner ad slide ${index + 1}`}
                      className="aspect-[3/2] w-full object-cover object-center select-none"
                      loading={index === 0 ? "eager" : "lazy"}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Slider Navigation & Dots */}
            {heroImages.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between p-3 opacity-0 group-hover/slider:opacity-100 transition-opacity pointer-events-none z-20">
                  <Button
                    variant="soft"
                    size="icon"
                    className="pointer-events-auto h-9 w-9 rounded-full bg-background/70 backdrop-blur-md border border-border/60 hover:bg-primary/20 text-foreground shadow-md transition-transform hover:scale-105"
                    onClick={(e) => { e.preventDefault(); scrollPrev(); }}
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="soft"
                    size="icon"
                    className="pointer-events-auto h-9 w-9 rounded-full bg-background/70 backdrop-blur-md border border-border/60 hover:bg-primary/20 text-foreground shadow-md transition-transform hover:scale-105"
                    onClick={(e) => { e.preventDefault(); scrollNext(); }}
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 z-20">
                  {heroImages.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (emblaApi) {
                          emblaApi.scrollTo(i);
                          autoplay.current.reset();
                        }
                      }}
                      aria-label={`Go to slide ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        selectedIndex === i
                          ? "w-6 bg-primary shadow-[0_0_8px_rgba(56,189,248,0.6)]"
                          : "w-2 bg-white/50 hover:bg-white/90"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
