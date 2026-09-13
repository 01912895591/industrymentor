import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ProjectWithRelations,
  ProjectDifficulty,
  ProjectDeliverable,
  ProjectEvaluationCriterion,
  ProjectResource,
} from "@/types/projects";

function parseJsonArray<T>(val: any, fallback: T[] = []): T[] {
  if (!val) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * Hook to fetch all published projects with mapped career pathways and skills
 * Public endpoint: strictly filters by is_published = true
 */
export function usePublishedProjects() {
  return useQuery({
    queryKey: ["public_published_projects"],
    queryFn: async (): Promise<ProjectWithRelations[]> => {
      // 1. Fetch published master projects
      const { data: projects, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("is_published", true)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (pError) throw pError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);

      // 2. Fetch project career paths junctions
      const { data: pcpData, error: pcpError } = await supabase
        .from("project_career_paths")
        .select("project_id, order_index, career_path:career_paths(id, title, slug, domain)")
        .in("project_id", projectIds);

      if (pcpError) {
        console.warn("Could not fetch project career paths:", pcpError);
      }

      // 3. Fetch project skills junctions
      const { data: psData, error: psError } = await supabase
        .from("project_skills")
        .select("project_id, is_primary, order_index, skill:skills(id, title, slug, category, difficulty)")
        .in("project_id", projectIds);

      if (psError) {
        console.warn("Could not fetch project skills:", psError);
      }

      // Group junctions by project_id
      const careerMap: Record<string, any[]> = {};
      if (pcpData) {
        for (const row of pcpData) {
          if (!careerMap[row.project_id]) careerMap[row.project_id] = [];
          if (row.career_path) {
            careerMap[row.project_id].push(row.career_path);
          }
        }
      }

      const skillMap: Record<string, any[]> = {};
      if (psData) {
        for (const row of psData) {
          if (!skillMap[row.project_id]) skillMap[row.project_id] = [];
          if (row.skill) {
            skillMap[row.project_id].push({
              ...(row.skill as any),
              is_primary: row.is_primary,
            });
          }
        }
      }

      return projects.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        short_description: p.short_description,
        detailed_brief: p.detailed_brief,
        domain: p.domain,
        difficulty: p.difficulty as ProjectDifficulty,
        estimated_hours: p.estimated_hours,
        learning_objectives: parseJsonArray<string>(p.learning_objectives),
        deliverables: parseJsonArray<ProjectDeliverable>(p.deliverables),
        evaluation_criteria: parseJsonArray<ProjectEvaluationCriterion>(p.evaluation_criteria),
        instructions: p.instructions,
        resources: parseJsonArray<ProjectResource>(p.resources),
        mentor_guidance: p.mentor_guidance,
        is_published: p.is_published,
        order_index: p.order_index,
        created_at: p.created_at,
        updated_at: p.updated_at,
        career_paths: careerMap[p.id] || [],
        skills: skillMap[p.id] || [],
      }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Hook to fetch a single published project by slug with its career paths and skills
 * Resolves strictly published projects. Returns null if not found or unpublished.
 */
export function usePublishedProjectBySlug(slug?: string) {
  return useQuery({
    queryKey: ["public_project_by_slug", slug],
    queryFn: async (): Promise<ProjectWithRelations | null> => {
      if (!slug || !slug.trim()) return null;

      const cleanSlug = slug.trim().toLowerCase();

      // 1. Fetch project by slug where is_published = true
      const { data: project, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", cleanSlug)
        .eq("is_published", true)
        .maybeSingle();

      if (pError) throw pError;
      if (!project) return null;

      // 2. Fetch career path mappings
      const { data: pcpData, error: pcpError } = await supabase
        .from("project_career_paths")
        .select("order_index, career_path:career_paths(id, title, slug, domain, description)")
        .eq("project_id", project.id)
        .order("order_index", { ascending: true });

      if (pcpError) {
        console.warn("Could not fetch project career paths for slug:", pcpError);
      }

      // 3. Fetch skill mappings
      const { data: psData, error: psError } = await supabase
        .from("project_skills")
        .select("is_primary, order_index, skill:skills(id, title, slug, category, difficulty, practical_application)")
        .eq("project_id", project.id)
        .order("order_index", { ascending: true });

      if (psError) {
        console.warn("Could not fetch project skills for slug:", psError);
      }

      const careerPaths = (pcpData || [])
        .map((row) => row.career_path)
        .filter(Boolean) as any[];

      const skills = (psData || [])
        .map((row) => ({
          ...(row.skill as any),
          is_primary: row.is_primary,
        }))
        .filter(Boolean);

      return {
        id: project.id,
        slug: project.slug,
        title: project.title,
        short_description: project.short_description,
        detailed_brief: project.detailed_brief,
        domain: project.domain,
        difficulty: project.difficulty as ProjectDifficulty,
        estimated_hours: project.estimated_hours,
        learning_objectives: parseJsonArray<string>(project.learning_objectives),
        deliverables: parseJsonArray<ProjectDeliverable>(project.deliverables),
        evaluation_criteria: parseJsonArray<ProjectEvaluationCriterion>(project.evaluation_criteria),
        instructions: project.instructions,
        resources: parseJsonArray<ProjectResource>(project.resources),
        mentor_guidance: project.mentor_guidance,
        is_published: project.is_published,
        order_index: project.order_index,
        created_at: project.created_at,
        updated_at: project.updated_at,
        career_paths: careerPaths,
        skills: skills,
      };
    },
    enabled: Boolean(slug && slug.trim()),
    staleTime: 1000 * 60 * 5,
  });
}
