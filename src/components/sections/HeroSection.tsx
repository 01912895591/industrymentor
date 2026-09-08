import { Button } from "@/components/ui/button";
import defaultHeroImage from "@/assets/hero-garment.jpg";
import courseReact from "@/assets/course-react.jpg";
import courseDesign from "@/assets/course-design.jpg";
import { LibraryBig, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { AnimatedHeroTitle } from "@/components/ui/AnimatedHeroTitle";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";


export function HeroSection() {
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [loadingHero, setLoadingHero] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 4000 })]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    const fetchHeroImages = async () => {
      try {
        const { data, error } = await (supabase
          .from("site_settings" as any)
          .select("value")
          .eq("key", "hero_image_url")
          .single()) as any;

        if (data?.value) {
          if (Array.isArray(data.value) && data.value.length > 0) {
            setHeroImages(data.value);
          } else if (typeof data.value === 'string') {
            setHeroImages([data.value]);
          }
        } else {
          // No data in DB, use defaults
          setHeroImages([defaultHeroImage, courseReact, courseDesign]);
        }
      } catch (error) {
        console.error("Error fetching hero images:", error);
        setHeroImages([defaultHeroImage, courseReact, courseDesign]);
      } finally {
        setLoadingHero(false);
      }
    };

    fetchHeroImages();
  }, []);

  return (
    <section className="relative overflow-hidden pt-6 xs:pt-8 sm:pt-20 lg:pt-24">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 sm:gap-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/30 px-4 py-2 text-sm text-muted-foreground shadow-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-glow" />
            Launching future leaders in Industry
          </div>

          <AnimatedHeroTitle />
          <p className="mt-4 max-w-xl text-pretty text-base xs:text-lg leading-relaxed text-muted-foreground sm:mt-5">
            IndustryMentor bridges the gap between academic theory and real-world application. Enroll in expert-led courses
            designed for the modern professional.
          </p>

          <div className="mt-6 flex flex-row gap-2 sm:mt-8 sm:gap-3">
            <Button variant="hero" size="lg" asChild className="flex-1 whitespace-nowrap px-3 text-[10px] sm:px-8 sm:text-base md:flex-none">
              <NavLink to="/courses">Browse Courses</NavLink>
            </Button>
            <Button variant="outline" size="lg" asChild className="flex-1 whitespace-nowrap px-3 text-[10px] sm:px-8 sm:text-base md:flex-none">
              <NavLink to="/#library">
                <LibraryBig className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Explore Library</span>
                <span className="xs:hidden">Library</span>
              </NavLink>
            </Button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 text-[10px] sm:grid-cols-3 sm:gap-4 sm:text-xs">
            <div className="rounded-xl border border-border/60 bg-card/25 p-2 transition-colors hover:bg-card/40 sm:rounded-2xl sm:p-3">
              <div className="text-base font-extrabold sm:text-xl">120+</div>
              <div className="text-muted-foreground">Lessons</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/25 p-2 transition-colors hover:bg-card/40 sm:rounded-2xl sm:p-3">
              <div className="text-base font-extrabold sm:text-xl">30+</div>
              <div className="text-muted-foreground">Mentors</div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/25 p-2 transition-colors hover:bg-card/40 sm:rounded-2xl sm:p-3">
              <div className="text-base font-extrabold sm:text-xl">4.8</div>
              <div className="text-muted-foreground">Avg rating</div>
            </div>
          </div>
        </div>

        <div className="relative group/slider">
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/20 shadow-elev sm:rounded-[2rem]">
            {loadingHero ? (
              <div className="aspect-[16/10] w-full animate-pulse bg-muted/20" />
            ) : (
              <div className="overflow-hidden" ref={emblaRef}>
                <div className="flex">
                  {heroImages.map((src, index) => (
                    <div className="flex-[0_0_100%] min-w-0" key={index}>
                      <img
                        src={src}
                        alt={`Hero slide ${index + 1}`}
                        className="aspect-[16/10] w-full object-cover object-center"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Slider Navigation & Dots (only if more than 1 image and not loading) */}
            {!loadingHero && heroImages.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover/slider:opacity-100 transition-opacity">
                  <Button
                    variant="soft"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-background/50 backdrop-blur-sm border-none hover:bg-primary/20"
                    onClick={(e) => { e.preventDefault(); scrollPrev(); }}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="soft"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-background/50 backdrop-blur-sm border-none hover:bg-primary/20"
                    onClick={(e) => { e.preventDefault(); scrollNext(); }}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {heroImages.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-background/50 transition-all"
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
