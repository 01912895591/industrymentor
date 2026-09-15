import { BadgeCheck, CalendarCheck, Infinity, Library, Users, Zap } from "lucide-react";

const items = [
  {
    icon: BadgeCheck,
    title: "Industry Certification",
    desc: "Receive a recognized certificate upon course completion to boost your professional credibility.",
  },
  {
    icon: Infinity,
    title: "Lifetime Support",
    desc: "Get unlimited access to materials and ongoing mentor support even after completion.",
  },
  {
    icon: Library,
    title: "Free Resources",
    desc: "Access our library of e-books, SOPs, and industry templates at no extra cost.",
  },
  {
    icon: Users,
    title: "Expert-Led Mentorship",
    desc: "Learn from working professionals through structured guidance, feedback, and practical insights.",
  },
  {
    icon: Zap,
    title: "Hands-On Projects",
    desc: "Build portfolio-ready projects with real-world workflows, templates, and case studies.",
  },
  {
    icon: CalendarCheck,
    title: "Flexible Learning",
    desc: "Study at your own pace with bite-sized lessons and resources you can revisit anytime.",
  },
];

export function WhyChooseSection() {
  return (
    <section className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Why Choose <span className="text-primary">IndustryMentor</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            We go beyond traditional learning. Enroll and gain access to a comprehensive ecosystem designed for your
            success.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="relative overflow-hidden rounded-xl border border-border/70 bg-card/50 p-6 shadow-sm transition-all duration-200 hover:border-border-active hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-11 w-11 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
                  <it.icon className="h-5 w-5" />
                </div>
                <div className="text-base font-bold text-foreground">{it.title}</div>
              </div>
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
