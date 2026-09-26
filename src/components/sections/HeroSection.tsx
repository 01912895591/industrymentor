import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight, Users, FileText, ShieldCheck, MessageSquare, BookOpen, GraduationCap, Factory } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const PRIMARY_HERO_SLIDES: string[] = [
  "https://fiirnhpsldouvnfvbtun.supabase.co/storage/v1/object/public/site_assets/hero-image-1772869711635.webp",
  "https://fiirnhpsldouvnfvbtun.supabase.co/storage/v1/object/public/site_assets/hero-image-1772354426020.webp",
  "https://fiirnhpsldouvnfvbtun.supabase.co/storage/v1/object/public/site_assets/hero-image-1772864274949.webp",
];

const DYNAMIC_WORDS = ["Lead", "Succeed", "Innovate", "Scale"];

export function HeroSection() {
  const [heroImages, setHeroImages] = useState<string[]>(PRIMARY_HERO_SLIDES);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordPhase, setWordPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const interval = setInterval(() => {
      setWordPhase("exit");
      setTimeout(() => {
        setWordIndex((prev) => (prev + 1) % DYNAMIC_WORDS.length);
        setWordPhase("enter");
      }, 350);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

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
            imgs = data.value.filter((url: any) => typeof url === "string" && !url.includes("hero-garment"));
          } else if (typeof data.value === "string" && !data.value.includes("hero-garment")) {
            imgs = [data.value];
          }

          if (imgs.length > 0) {
            // Prioritize the Garment Quality Inspector banner (matching the user's primary choice) as the first slide
            const sorted = [...imgs].sort((a, b) => {
              if (a.includes("1772869711635")) return -1;
              if (b.includes("1772869711635")) return 1;
              return 0;
            });

            setHeroImages(sorted);
          }
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
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            INDUSTRY-LED LEARNING
          </div>

          <div className="relative">
            {/* Ambient soft glow aura behind headline */}
            <div
              className="pointer-events-none absolute -top-8 -left-6 -z-10 h-44 w-72 sm:w-96 rounded-full bg-primary/10 blur-3xl opacity-35"
              aria-hidden="true"
            />

            <h1
              className="mt-3 text-3xl xs:text-4xl sm:text-4xl lg:text-[2.6rem] xl:text-5xl font-black leading-[1.2]"
              aria-label={`Guiding You To ${DYNAMIC_WORDS[wordIndex]}`}
            >
              <span className="block text-foreground pb-1 tracking-normal sm:tracking-tight">
                Guiding You To
              </span>
              <span className="block mt-1 sm:mt-2 h-[1.25em] overflow-visible">
                <span
                  key={DYNAMIC_WORDS[wordIndex]}
                  className={`hero-dynamic-word inline-block ${
                    wordPhase === "enter" ? "hero-word-enter" : "hero-word-exit"
                  }`}
                >
                  {DYNAMIC_WORDS[wordIndex]}
                </span>
              </span>
            </h1>
          </div>

          {/* Progression Pathway Strip */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-slate-200 tracking-normal">
            <span>Learn</span>
            <span className="text-border/70 select-none">|</span>
            <span>Apply</span>
            <span className="text-border/70 select-none">|</span>
            <span>Get Mentored</span>
            <span className="text-border/70 select-none">|</span>
            <span>Build Your Career</span>
          </div>

          <p className="mt-3 max-w-xl text-pretty text-xs xs:text-sm sm:text-base leading-relaxed text-muted-foreground">
            Practical, industry-focused training for the garments and other manufacturing industries — so you can gain real skills, confidence, and a better future.
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
              className="group px-4.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold border-border/80 bg-card/40 backdrop-blur-md transition-all duration-200 hover:border-primary/50 hover:bg-card/70 hover:shadow-sm"
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

          {/* Key Value Pillars / Trust Highlights */}
          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-6 border-t border-border/40 pt-5">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="h-6 w-6 text-emerald-400 flex-shrink-0" strokeWidth={2} />
              <div className="text-xs sm:text-[13px] font-medium leading-tight text-slate-200">
                <div>Practitioner-Led</div>
                <div>Learning</div>
              </div>
            </div>

            <div className="hidden sm:block h-7 w-px bg-border/60" aria-hidden="true" />

            <div className="flex items-center gap-2.5">
              <Factory className="h-6 w-6 text-emerald-400 flex-shrink-0" strokeWidth={2} />
              <div className="text-xs sm:text-[13px] font-medium leading-tight text-slate-200">
                <div>Real Industry</div>
                <div>Knowledge</div>
              </div>
            </div>

            <div className="hidden sm:block h-7 w-px bg-border/60" aria-hidden="true" />

            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-6 w-6 text-emerald-400 flex-shrink-0" strokeWidth={2} />
              <div className="text-xs sm:text-[13px] font-medium leading-tight text-slate-200">
                <div>Verifiable</div>
                <div>Certificates</div>
              </div>
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
                      fetchPriority={index === 0 ? "high" : "low"}
                      width={600}
                      height={400}
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
                          ? "w-6 bg-primary"
                          : "w-2 bg-white/50 hover:bg-white/90"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Signature Brand Motto Handwriting Effect (Sleek & Thin) */}
          <div className="mt-3 sm:mt-4 flex justify-center sm:justify-end items-center px-4 sm:px-0 sm:pr-8 select-none">
            <div className="relative inline-block transform -rotate-[10deg] sm:-rotate-[11deg] transition-all duration-300 hover:rotate-0 hover:scale-105 group/motto cursor-default">
              <div className="font-handwriting text-[17px] xs:text-[19px] sm:text-[22px] text-slate-200/95 font-light tracking-wide leading-[1.05] drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
                <div className="whitespace-nowrap">Skills Today</div>
                <div className="whitespace-nowrap pl-2 sm:pl-2.5">A Better Tomorrow</div>
              </div>
              <svg
                className="w-36 xs:w-40 sm:w-44 h-3 sm:h-3.5 -mt-0.5 ml-1 transition-transform duration-300 group-hover/motto:scale-105"
                viewBox="0 0 200 16"
                fill="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="signatureSwooshGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="35%" stopColor="#06b6d4" />
                    <stop offset="70%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#378ADD" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 13 C 45 14.5, 110 13.5, 196 4 C 135 10.5, 75 12, 4 13 Z"
                  fill="url(#signatureSwooshGrad)"
                />
                <path
                  d="M6 13.2 C 50 14.5, 120 13, 194 4.5"
                  stroke="url(#signatureSwooshGrad)"
                  strokeWidth="1.1"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
