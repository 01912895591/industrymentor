import { Button } from "@/components/ui/button";
import { ArrowRight, Users, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

export function FinalCTASection() {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden bg-card/40 border-t border-border/60">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center relative z-10">
        <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          VERIFIED INDUSTRIAL CAREER PLATFORM
        </div>

        <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl text-foreground">
          Ready to Build Your{" "}
          <span className="text-primary">Industry Advantage?</span>
        </h2>

        <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
          Join emerging engineers, merchandisers, and manufacturing professionals learning actionable skills from seasoned factory leaders.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button variant="hero" size="lg" asChild className="px-8 text-base">
            <Link to="/courses">
              Start Learning Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild className="px-8 text-base">
            <Link to="/#mentors">
              <Users className="mr-2 h-4 w-4 text-primary" />
              Explore Mentors
            </Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Practitioner-Led Courses</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Production SOPs &amp; E-Books</span>
          </div>
          <span className="text-border hidden sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Authentic Certificate Verification</span>
          </div>
        </div>
      </div>
    </section>
  );
}
