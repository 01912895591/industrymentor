import { FileSpreadsheet, Layers, CheckSquare, ArrowRight, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const practicalModules = [
  {
    icon: Layers,
    title: "Garment Tech-Pack Execution",
    category: "Merchandising & Sourcing",
    description: "Deconstruct real buyer specification sheets, bill of materials (BOM), measurement tolerances, and trim cards.",
    tags: ["Tech-Packs", "BOM", "Trim Cards"],
  },
  {
    icon: FileSpreadsheet,
    title: "SMV & Line Balancing Models",
    category: "Industrial Engineering",
    description: "Calculate Standard Minute Value (SMV), target hourly production, pitch diagrams, and eliminate sewing bottle-necks.",
    tags: ["SMV", "Line Balancing", "Bottle-neck Analysis"],
  },
  {
    icon: CheckSquare,
    title: "Defect Classification & Quality SOPs",
    category: "Quality Assurance",
    description: "Execute 4-point fabric inspection systems, AQL 2.5 final audits, root cause analysis, and CAP implementations.",
    tags: ["AQL 2.5", "4-Point System", "CAP Audits"],
  },
];

export function ProjectsTeaserSection() {
  return (
    <section id="projects" className="scroll-mt-24 pt-12 pb-20 sm:pt-14 sm:pb-20 lg:pt-16 lg:pb-24 border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-md border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary uppercase tracking-wider">
              <FolderKanban className="h-3.5 w-3.5" />
              PRACTICAL PROJECT METHODOLOGY
            </div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
              Don't Just Learn Theory.{" "}
              <span className="text-primary block sm:inline">Build Practical Capability.</span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every course at IndustryMentor is grounded in real operational projects that reflect standard daily duties inside export garment factories and buying houses.
            </p>
          </div>

          <div className="shrink-0">
            <Button variant="soft" size="lg" asChild>
              <Link to="/courses">
                View Practical Courses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {practicalModules.map((item) => (
            <Card
              key={item.title}
              variant="interactive"
              className="flex flex-col justify-between"
            >
              <CardHeader className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                    {item.category}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                <CardDescription className="mt-2 text-xs leading-relaxed">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-border/50">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-muted-foreground border border-border/40"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
