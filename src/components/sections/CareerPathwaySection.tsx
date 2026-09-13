import { BookOpen, Wrench, Users, Briefcase, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const steps = [
  {
    step: "01",
    title: "Learn",
    subtitle: "Floor-Tested Knowledge",
    description: "Study practical modules taught by active factory heads, not textbook theory.",
    icon: BookOpen,
  },
  {
    step: "02",
    title: "Practice",
    subtitle: "Real Documentation",
    description: "Analyze buyer tech-packs, calculate consumption, and balance sewing lines.",
    icon: Wrench,
  },
  {
    step: "03",
    title: "Get Mentored",
    subtitle: "1:1 Guidance",
    description: "Gain direct feedback from experienced leaders across Tier-1 garment manufacturing.",
    icon: Users,
  },
  {
    step: "04",
    title: "Build Portfolio",
    subtitle: "Tangible Work Evidence",
    description: "Complete practical capstone assignments that demonstrate operational capability.",
    icon: Briefcase,
  },
  {
    step: "05",
    title: "Advance Career",
    subtitle: "Verified Industry Credential",
    description: "Graduate with an authenticated certificate respected by recruiters and factory HR.",
    icon: Award,
  },
];

export function CareerPathwaySection() {
  return (
    <section id="career" className="scroll-mt-24 py-16 sm:py-24 border-b border-border/40 bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider shadow-[0_0_15px_rgba(56,189,248,0.15)] backdrop-blur-sm">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            THE CAREER OPERATING SYSTEM
          </div>

          <div className="relative">
            {/* Ambient decorative glow behind heading */}
            <div
              className="pointer-events-none absolute left-1/2 -top-6 -translate-x-1/2 -z-10 h-36 w-80 sm:w-[28rem] rounded-full bg-primary/15 blur-3xl opacity-60"
              aria-hidden="true"
            />

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent inline-block">
                Education is Only the Beginning.
              </span>{" "}
              <span className="hero-gradient-text block sm:inline-block">
                IndustryMentor is the Bridge.
              </span>
            </h2>
          </div>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            The traditional classroom teaches abstract equations. We guide you through the exact five-stage progression required to become an indispensable industrial leader.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className="relative flex flex-col justify-between rounded-lg border border-border/70 bg-card/60 p-5 shadow-sm transition-all duration-200 hover:border-border-active hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded bg-primary/15 border border-primary/20">
                    STEP {s.step}
                  </span>
                  <div className="grid h-8 w-8 place-items-center rounded-md bg-surface-2 text-muted-foreground">
                    <s.icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">{s.title}</h3>
                <div className="text-xs font-medium text-primary/90 mt-0.5">{s.subtitle}</div>
                <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-border">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-3">
          <Button variant="hero" size="lg" asChild className="px-8 text-sm sm:text-base">
            <Link to="/career">
              Explore Career Pathways &amp; Skills
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="px-6 text-sm sm:text-base border-border/70 hover:border-primary/40">
            <Link to="/courses">Browse All Courses</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
