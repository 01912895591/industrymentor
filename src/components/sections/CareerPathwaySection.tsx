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
    <section id="career" className="scroll-mt-24 py-20 lg:py-24 border-b border-border/40 bg-surface/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" />
            THE CAREER OPERATING SYSTEM
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-foreground">Education is Only the Beginning.</span>{" "}
            <span className="text-primary block sm:inline-block">
              IndustryMentor is the Bridge.
            </span>
          </h2>

          <p className="mt-4 text-sm sm:text-base text-muted-foreground leading-relaxed">
            The traditional classroom teaches abstract equations. We guide you through the exact five-stage progression required to become an indispensable industrial leader.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {steps.map((s, idx) => (
            <div
              key={s.step}
              className="relative flex flex-col justify-between rounded-xl border border-border/70 bg-card/60 p-5 shadow-sm transition-all duration-200 hover:border-border-active hover:shadow-md"
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
