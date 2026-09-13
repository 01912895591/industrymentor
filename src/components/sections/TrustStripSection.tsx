import { Users, Cpu, ShieldCheck, TrendingUp } from "lucide-react";

const pillars = [
  {
    icon: Users,
    title: "Industry Experts",
    description: "Learn directly from factory heads, IE managers, and certified quality specialists.",
  },
  {
    icon: Cpu,
    title: "Practical Execution",
    description: "Master factory SOPs, tech-packs, SMV calculations, and floor line balancing.",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable Credentials",
    description: "Tamper-proof certificate verification system validated by industry leaders.",
  },
  {
    icon: TrendingUp,
    title: "Career Acceleration",
    description: "Job-ready competencies tailored for textile engineers, merchandisers, and supervisors.",
  },
];

export function TrustStripSection() {
  return (
    <section className="border-y border-border/60 bg-card/25 py-8 sm:py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="flex items-start gap-3.5 p-2 rounded-lg transition-colors"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                <pillar.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight">
                  {pillar.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
