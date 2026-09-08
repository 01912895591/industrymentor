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
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Why Choose <span className="text-primary">IndustryMentor</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base xs:text-lg text-muted-foreground">
            We go beyond traditional learning. Enroll and gain access to a comprehensive ecosystem designed for your
            success.
          </p>
        </div>
        Line 49:

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/25 p-7 shadow-elev"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand shadow-glow">
                  <it.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="text-lg font-extrabold">{it.title}</div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-brand opacity-15 blur-2xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
