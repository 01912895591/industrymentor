import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Compass,
  BookOpen,
  Users,
  FileText,
  Star,
  Award,
  ChevronRight,
  ExternalLink,
  Layers,
} from "lucide-react";
import type {
  CareerPathRow,
  SkillRow,
  CareerPathSkillRow,
  SkillCourseRow,
  SkillMentorRow,
  SkillLibraryItemRow,
  CourseOption,
  MentorOption,
  LibraryItemOption,
} from "@/hooks/useCareer";

interface CareerHierarchyViewProps {
  careerPaths: CareerPathRow[];
  skills: SkillRow[];
  careerPathSkills: CareerPathSkillRow[];
  skillCourses: SkillCourseRow[];
  skillMentors: SkillMentorRow[];
  skillLibraryItems: SkillLibraryItemRow[];
  courses: CourseOption[];
  mentors: MentorOption[];
  libraryItems: LibraryItemOption[];
  onNavigateToTab?: (tab: string, contextId?: string) => void;
}

export function CareerHierarchyView({
  careerPaths,
  skills,
  careerPathSkills,
  skillCourses,
  skillMentors,
  skillLibraryItems,
  courses,
  mentors,
  libraryItems,
  onNavigateToTab,
}: CareerHierarchyViewProps) {
  const [selectedPathId, setSelectedPathId] = useState<string>(
    careerPaths[0]?.id ?? ""
  );

  React.useEffect(() => {
    if (!selectedPathId && careerPaths.length > 0) {
      setSelectedPathId(careerPaths[0].id);
    }
  }, [careerPaths, selectedPathId]);

  const activePath = useMemo(
    () => careerPaths.find((p) => p.id === selectedPathId),
    [careerPaths, selectedPathId]
  );

  // Group skills for this pathway by stage tier
  const tieredSkills = useMemo(() => {
    const mappings = careerPathSkills
      .filter((cps) => cps.career_path_id === selectedPathId)
      .sort((a, b) => a.order_index - b.order_index);

    const tiers: Record<number, Array<{
      mapping: CareerPathSkillRow;
      skill: SkillRow | undefined;
      linkedCourses: Array<{ mapping: SkillCourseRow; course: CourseOption | undefined }>;
      linkedMentors: Array<{ mapping: SkillMentorRow; mentor: MentorOption | undefined }>;
      linkedLibrary: Array<{ mapping: SkillLibraryItemRow; item: LibraryItemOption | undefined }>;
    }>> = { 1: [], 2: [], 3: [], 4: [], 5: [] };

    mappings.forEach((m) => {
      const tier = m.stage_tier ?? 1;
      const skill = skills.find((s) => s.id === m.skill_id);

      const sc = skillCourses
        .filter((c) => c.skill_id === m.skill_id)
        .map((c) => ({ mapping: c, course: courses.find((co) => co.id === c.course_id) }));

      const sm = skillMentors
        .filter((mem) => mem.skill_id === m.skill_id)
        .map((mem) => ({ mapping: mem, mentor: mentors.find((mo) => mo.id === mem.mentor_id) }));

      const sli = skillLibraryItems
        .filter((l) => l.skill_id === m.skill_id)
        .map((l) => ({ mapping: l, item: libraryItems.find((li) => li.id === l.library_item_id) }));

      if (!tiers[tier]) tiers[tier] = [];
      tiers[tier].push({
        mapping: m,
        skill,
        linkedCourses: sc,
        linkedMentors: sm,
        linkedLibrary: sli,
      });
    });

    return tiers;
  }, [
    selectedPathId,
    careerPathSkills,
    skills,
    skillCourses,
    skillMentors,
    skillLibraryItems,
    courses,
    mentors,
    libraryItems,
  ]);

  const tierTitles: Record<number, string> = {
    1: "Stage 1: Core Fundamentals & Direct Execution",
    2: "Stage 2: Applied Engineering & Systems Optimization",
    3: "Stage 3: Executive Leadership & Factory Governance",
    4: "Stage 4: Specialized Master Track",
    5: "Stage 5: Plant Operations & Compliance",
  };

  return (
    <div className="space-y-4">
      {/* Header Selector */}
      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Inspect Curriculum Graph</div>
              <Select value={selectedPathId} onValueChange={setSelectedPathId}>
                <SelectTrigger className="w-full sm:w-[380px] font-semibold text-sm h-9 mt-0.5">
                  <SelectValue placeholder="Select a career pathway" />
                </SelectTrigger>
                <SelectContent>
                  {careerPaths.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-sm">
                      {p.title} ({p.domain})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activePath && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => onNavigateToTab?.("mappings", activePath.id)}
              >
                <span>Edit Path Mappings</span>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pathway Detail Summary Card */}
      {activePath && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg text-foreground">{activePath.title}</span>
                  <Badge variant="outline">{activePath.domain}</Badge>
                  {activePath.is_published ? (
                    <Badge variant="success">Published</Badge>
                  ) : (
                    <Badge variant="warning">Draft</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                  {activePath.description}
                </p>
                {activePath.practical_scope && (
                  <p className="text-xs text-foreground/80 mt-1 font-medium">
                    <span className="text-primary font-semibold">Floor Scope:</span>{" "}
                    {activePath.practical_scope}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <code className="text-xs bg-background/80 px-2 py-1 rounded border border-border/40 font-mono text-muted-foreground">
                  slug: {activePath.slug}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchical Stage Progression */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((tierNum) => {
          const items = tieredSkills[tierNum] || [];
          if (items.length === 0) return null;

          return (
            <div key={tierNum} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <Badge variant="default" className="text-xs font-semibold">
                  Stage {tierNum}
                </Badge>
                <span className="text-sm font-bold text-foreground">
                  {tierTitles[tierNum] || `Stage ${tierNum}`}
                </span>
                <span className="text-xs text-muted-foreground">({items.length} skills)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {items.map(({ mapping, skill, linkedCourses, linkedMentors, linkedLibrary }) => (
                  <Card
                    key={mapping.skill_id}
                    className="border-border/60 bg-card hover:border-border transition-colors shadow-sm"
                  >
                    <CardHeader className="p-3.5 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Compass className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-sm text-foreground">
                              {skill?.title || mapping.skill_id}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Badge variant="outline" className="text-[10px] py-0">
                                {skill?.domain}
                              </Badge>
                              <Badge
                                variant={
                                  skill?.difficulty === "Foundational"
                                    ? "info"
                                    : skill?.difficulty === "Intermediate"
                                    ? "warning"
                                    : "default"
                                }
                                className="text-[10px] py-0"
                              >
                                {skill?.difficulty}
                              </Badge>
                              {mapping.is_core ? (
                                <Badge variant="secondary" className="text-[10px] py-0 font-medium text-primary">
                                  Core
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                                  Elective
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-3.5 pt-1 space-y-2.5 text-xs">
                      {skill?.description && (
                        <p className="text-muted-foreground text-[11px] line-clamp-2">
                          {skill.description}
                        </p>
                      )}

                      {/* Associated Real Courses */}
                      <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            Linked Courses ({linkedCourses.length})
                          </span>
                        </div>
                        {linkedCourses.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground italic">
                            No courses attached to this competency
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {linkedCourses.map(({ mapping: cMap, course }) => (
                              <div
                                key={cMap.course_id}
                                className="flex items-center justify-between text-[11px] bg-background/60 px-2 py-1 rounded"
                              >
                                <span className="font-medium truncate mr-2">
                                  {course?.title || cMap.course_id}
                                </span>
                                {cMap.is_primary && (
                                  <Badge variant="warning" className="text-[9px] py-0 h-4 px-1 shrink-0">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Associated Mentors */}
                      <div className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-cyan-400">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Attributed Mentors ({linkedMentors.length})
                          </span>
                        </div>
                        {linkedMentors.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground italic">
                            No mentors assigned
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {linkedMentors.map(({ mapping: mMap, mentor }) => (
                              <div
                                key={mMap.mentor_id}
                                className="flex items-center justify-between text-[11px] bg-background/60 px-2 py-1 rounded"
                              >
                                <div>
                                  <span className="font-medium">{mentor?.name || mMap.mentor_id}</span>
                                  {mMap.specialization_note && (
                                    <span className="text-[10px] text-muted-foreground ml-1.5 italic">
                                      ({mMap.specialization_note})
                                    </span>
                                  )}
                                </div>
                                {mMap.is_lead && (
                                  <Badge variant="default" className="text-[9px] py-0 h-4 px-1 bg-cyan-500/20 text-cyan-400 shrink-0">
                                    Lead
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Associated Library Handbooks */}
                      <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/15 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-rose-400">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Library Publications ({linkedLibrary.length})
                          </span>
                        </div>
                        {linkedLibrary.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground italic">
                            No technical handbooks linked
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {linkedLibrary.map(({ mapping: lMap, item }) => (
                              <div
                                key={lMap.library_item_id}
                                className="flex items-center justify-between text-[11px] bg-background/60 px-2 py-1 rounded"
                              >
                                <span className="font-medium truncate mr-2">
                                  {item?.title || lMap.library_item_id}
                                </span>
                                <Badge variant="outline" className="text-[9px] py-0 h-4 px-1 shrink-0">
                                  {lMap.resource_role || "Handbook"}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
