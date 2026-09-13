import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  Compass,
  Layers,
  BookOpen,
  Users,
  FileText,
  Network,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  useAdminCareerPaths,
  useAdminSkills,
  useAdminCareerPathSkills,
  useAdminSkillCourses,
  useAdminSkillMentors,
  useAdminSkillLibraryItems,
  useAdminCourses,
  useAdminMentors,
  useAdminLibraryItems,
} from "@/hooks/useCareer";
import { useQueryClient } from "@tanstack/react-query";

// Sub-components
import { CareerStatsHeader } from "./CareerStatsHeader";
import { CareerPathsTab } from "./CareerPathsTab";
import { SkillsTab } from "./SkillsTab";
import { CareerPathSkillsTab } from "./CareerPathSkillsTab";
import { SkillCoursesTab } from "./SkillCoursesTab";
import { SkillMentorsTab } from "./SkillMentorsTab";
import { SkillLibraryTab } from "./SkillLibraryTab";
import { CareerHierarchyView } from "./CareerHierarchyView";

export function CareerSkillsAdmin() {
  const queryClient = useQueryClient();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>("hierarchy");

  // Selected contexts for jump navigation
  const [selectedPathwayId, setSelectedPathwayId] = useState<string | undefined>();
  const [selectedSkillId, setSelectedSkillId] = useState<string | undefined>();

  // Fetch all real Supabase records
  const {
    data: careerPaths = [],
    isLoading: pathsLoading,
    isError: pathsError,
    error: pathsErr,
    refetch: refetchPaths,
  } = useAdminCareerPaths();

  const {
    data: skills = [],
    isLoading: skillsLoading,
    isError: skillsError,
    error: skillsErr,
    refetch: refetchSkills,
  } = useAdminSkills();

  const {
    data: careerPathSkills = [],
    isLoading: cpsLoading,
    refetch: refetchCps,
  } = useAdminCareerPathSkills();

  const {
    data: skillCourses = [],
    isLoading: scLoading,
    refetch: refetchSc,
  } = useAdminSkillCourses();

  const {
    data: skillMentors = [],
    isLoading: smLoading,
    refetch: refetchSm,
  } = useAdminSkillMentors();

  const {
    data: skillLibraryItems = [],
    isLoading: sliLoading,
    refetch: refetchSli,
  } = useAdminSkillLibraryItems();

  const { data: courses = [] } = useAdminCourses();
  const { data: mentors = [] } = useAdminMentors();
  const { data: libraryItems = [] } = useAdminLibraryItems();

  const isInitialLoading = pathsLoading || skillsLoading;
  const isRefreshing = cpsLoading || scLoading || smLoading || sliLoading;

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin_career_paths"] });
    queryClient.invalidateQueries({ queryKey: ["admin_skills"] });
    queryClient.invalidateQueries({ queryKey: ["admin_career_path_skills"] });
    queryClient.invalidateQueries({ queryKey: ["admin_skill_courses"] });
    queryClient.invalidateQueries({ queryKey: ["admin_skill_mentors"] });
    queryClient.invalidateQueries({ queryKey: ["admin_skill_library_items"] });
    queryClient.invalidateQueries({ queryKey: ["admin_courses_lookup"] });
    queryClient.invalidateQueries({ queryKey: ["admin_mentors_lookup"] });
    queryClient.invalidateQueries({ queryKey: ["admin_library_items_lookup"] });
  };

  // Jump to specific tab with context
  const handleSelectPathwayForSkills = (pathwayId: string) => {
    setSelectedPathwayId(pathwayId);
    setActiveTab("path-skills");
  };

  const handleSelectSkillForCourses = (skillId: string) => {
    setSelectedSkillId(skillId);
    setActiveTab("skill-courses");
  };

  const handleSelectSkillForMentors = (skillId: string) => {
    setSelectedSkillId(skillId);
    setActiveTab("skill-mentors");
  };

  const handleSelectSkillForLibrary = (skillId: string) => {
    setSelectedSkillId(skillId);
    setActiveTab("skill-library");
  };

  // Error State
  if (pathsError || skillsError) {
    const errorMsg = (pathsErr as any)?.message || (skillsErr as any)?.message || "Failed to load database tables.";
    return (
      <div className="space-y-6">
        <Card className="border-destructive/40 bg-destructive/5 p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-destructive">Failed to Load Career & Skill Database</h2>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" size="sm" onClick={handleRefreshAll} className="gap-2 mt-2">
                <RefreshCw className="h-4 w-4" />
                Retry Connection
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Initial Loading Skeleton
  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Stats Summary Header */}
      <CareerStatsHeader
        careerPaths={careerPaths}
        skills={skills}
        careerPathSkills={careerPathSkills}
        skillCourses={skillCourses}
        skillMentors={skillMentors}
        skillLibraryItems={skillLibraryItems}
        isLoading={isRefreshing}
        onRefresh={handleRefreshAll}
      />

      {/* Main Tabs Segment */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-1">
          <TabsList className="h-11 p-1 bg-muted/60 border border-border/50 rounded-xl inline-flex min-w-full sm:min-w-0">
            <TabsTrigger value="hierarchy" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <Network className="h-3.5 w-3.5 text-primary" />
              <span>Curriculum Graph</span>
            </TabsTrigger>
            <TabsTrigger value="paths" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <Briefcase className="h-3.5 w-3.5 text-blue-400" />
              <span>Career Pathways ({careerPaths.length})</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <Compass className="h-3.5 w-3.5 text-emerald-400" />
              <span>Skills Inventory ({skills.length})</span>
            </TabsTrigger>
            <TabsTrigger value="path-skills" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <Layers className="h-3.5 w-3.5 text-purple-400" />
              <span>Career ↔ Skills</span>
            </TabsTrigger>
            <TabsTrigger value="skill-courses" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <BookOpen className="h-3.5 w-3.5 text-amber-400" />
              <span>Skill ↔ Courses</span>
            </TabsTrigger>
            <TabsTrigger value="skill-mentors" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <Users className="h-3.5 w-3.5 text-cyan-400" />
              <span>Skill ↔ Mentors</span>
            </TabsTrigger>
            <TabsTrigger value="skill-library" className="gap-1.5 text-xs font-semibold px-3 rounded-lg data-[state=active]:shadow-sm">
              <FileText className="h-3.5 w-3.5 text-rose-400" />
              <span>Skill ↔ Library</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Curriculum Graph & Hierarchy */}
        <TabsContent value="hierarchy" className="space-y-4 focus-visible:outline-none">
          <CareerHierarchyView
            careerPaths={careerPaths}
            skills={skills}
            careerPathSkills={careerPathSkills}
            skillCourses={skillCourses}
            skillMentors={skillMentors}
            skillLibraryItems={skillLibraryItems}
            courses={courses}
            mentors={mentors}
            libraryItems={libraryItems}
            onNavigateToTab={(tab, contextId) => {
              if (tab === "mappings" && contextId) {
                handleSelectPathwayForSkills(contextId);
              }
            }}
          />
        </TabsContent>

        {/* Tab 2: Career Pathways CRUD */}
        <TabsContent value="paths" className="space-y-4 focus-visible:outline-none">
          <CareerPathsTab
            careerPaths={careerPaths}
            careerPathSkills={careerPathSkills}
            isLoading={pathsLoading}
            onRefresh={handleRefreshAll}
            onSelectPathwayForSkills={handleSelectPathwayForSkills}
          />
        </TabsContent>

        {/* Tab 3: Skills Inventory CRUD */}
        <TabsContent value="skills" className="space-y-4 focus-visible:outline-none">
          <SkillsTab
            skills={skills}
            careerPathSkills={careerPathSkills}
            skillCourses={skillCourses}
            skillMentors={skillMentors}
            skillLibraryItems={skillLibraryItems}
            isLoading={skillsLoading}
            onRefresh={handleRefreshAll}
            onSelectSkillForCourses={handleSelectSkillForCourses}
            onSelectSkillForMentors={handleSelectSkillForMentors}
            onSelectSkillForLibrary={handleSelectSkillForLibrary}
          />
        </TabsContent>

        {/* Tab 4: Career ↔ Skills Mapping */}
        <TabsContent value="path-skills" className="space-y-4 focus-visible:outline-none">
          <CareerPathSkillsTab
            careerPaths={careerPaths}
            skills={skills}
            careerPathSkills={careerPathSkills}
            selectedPathId={selectedPathwayId}
            onSelectPathId={setSelectedPathwayId}
            isLoading={cpsLoading}
            onRefresh={handleRefreshAll}
          />
        </TabsContent>

        {/* Tab 5: Skill ↔ Courses Mapping */}
        <TabsContent value="skill-courses" className="space-y-4 focus-visible:outline-none">
          <SkillCoursesTab
            skills={skills}
            skillCourses={skillCourses}
            courses={courses}
            selectedSkillId={selectedSkillId}
            onSelectSkillId={setSelectedSkillId}
            isLoading={scLoading}
            onRefresh={handleRefreshAll}
          />
        </TabsContent>

        {/* Tab 6: Skill ↔ Mentors Mapping */}
        <TabsContent value="skill-mentors" className="space-y-4 focus-visible:outline-none">
          <SkillMentorsTab
            skills={skills}
            skillMentors={skillMentors}
            mentors={mentors}
            selectedSkillId={selectedSkillId}
            onSelectSkillId={setSelectedSkillId}
            isLoading={smLoading}
            onRefresh={handleRefreshAll}
          />
        </TabsContent>

        {/* Tab 7: Skill ↔ Library Mapping */}
        <TabsContent value="skill-library" className="space-y-4 focus-visible:outline-none">
          <SkillLibraryTab
            skills={skills}
            skillLibraryItems={skillLibraryItems}
            libraryItems={libraryItems}
            selectedSkillId={selectedSkillId}
            onSelectSkillId={setSelectedSkillId}
            isLoading={sliLoading}
            onRefresh={handleRefreshAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
export default CareerSkillsAdmin;
