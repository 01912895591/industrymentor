import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ProjectFormData,
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
 * Fetch all projects with mapped career pathways and skills
 */
export function useAdminProjects() {
  return useQuery({
    queryKey: ["admin_projects"],
    queryFn: async (): Promise<ProjectWithRelations[]> => {
      // 1. Fetch master projects
      const { data: projects, error: pError } = await supabase
        .from("projects")
        .select("*")
        .order("order_index", { ascending: true });

      if (pError) throw pError;
      if (!projects || projects.length === 0) return [];

      const projectIds = projects.map((p) => p.id);

      // 2. Fetch project career paths junctions
      const { data: pcpData, error: pcpError } = await supabase
        .from("project_career_paths")
        .select("project_id, order_index, career_path:career_paths(id, title, slug, domain)")
        .in("project_id", projectIds);

      if (pcpError) console.warn("Could not fetch project career paths:", pcpError);

      // 3. Fetch project skills junctions
      const { data: psData, error: psError } = await supabase
        .from("project_skills")
        .select("project_id, is_primary, order_index, skill:skills(id, title, slug, category)")
        .in("project_id", projectIds);

      if (psError) console.warn("Could not fetch project skills:", psError);

      // 4. Fetch submission counts grouped by project
      const { data: subData, error: subError } = await supabase
        .from("project_submissions")
        .select("project_id");

      if (subError) console.warn("Could not fetch submission counts:", subError);

      const subCountMap: Record<string, number> = {};
      if (subData) {
        for (const sub of subData) {
          subCountMap[sub.project_id] = (subCountMap[sub.project_id] || 0) + 1;
        }
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
        submissions_count: subCountMap[p.id] || 0,
      }));
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch total submissions count
 */
export function useProjectSubmissionsSummary() {
  return useQuery({
    queryKey: ["project_submissions_summary"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("project_submissions")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.warn("Error fetching submission summary:", error);
        return { totalSubmissions: 0 };
      }
      return { totalSubmissions: count || 0 };
    },
    staleTime: 1000 * 60,
  });
}

/**
 * Hook to create a new project with junction mappings
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (form: ProjectFormData) => {
      // 1. Insert master project
      const { data: newProject, error: pError } = await supabase
        .from("projects")
        .insert({
          title: form.title.trim(),
          slug: form.slug.trim(),
          short_description: form.short_description.trim(),
          detailed_brief: form.detailed_brief.trim() || null,
          domain: form.domain.trim() || null,
          difficulty: form.difficulty || "Intermediate",
          estimated_hours: Number(form.estimated_hours) || 0,
          learning_objectives: form.learning_objectives as any,
          deliverables: form.deliverables as any,
          evaluation_criteria: form.evaluation_criteria as any,
          instructions: form.instructions.trim() || null,
          resources: form.resources as any,
          mentor_guidance: form.mentor_guidance.trim() || null,
          is_published: form.is_published,
          order_index: Number(form.order_index) || 0,
        })
        .select()
        .single();

      if (pError) throw pError;
      const projectId = newProject.id;

      // 2. Insert career path junctions
      if (form.career_path_ids && form.career_path_ids.length > 0) {
        const cpInserts = form.career_path_ids.map((cpId, idx) => ({
          project_id: projectId,
          career_path_id: cpId,
          order_index: idx + 1,
        }));
        const { error: cpErr } = await supabase
          .from("project_career_paths")
          .insert(cpInserts);
        if (cpErr) console.warn("Error inserting career path links:", cpErr);
      }

      // 3. Insert skill junctions
      if (form.skill_ids && form.skill_ids.length > 0) {
        const skillInserts = form.skill_ids.map((s, idx) => ({
          project_id: projectId,
          skill_id: s.skill_id,
          is_primary: s.is_primary,
          order_index: idx + 1,
        }));
        const { error: sErr } = await supabase
          .from("project_skills")
          .insert(skillInserts);
        if (sErr) console.warn("Error inserting skill links:", sErr);
      }

      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_projects"] });
      queryClient.invalidateQueries({ queryKey: ["project_submissions_summary"] });
    },
  });
}

/**
 * Hook to update an existing project and its junction mappings
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, form }: { id: string; form: ProjectFormData }) => {
      // 1. Update master project record
      const { data: updated, error: pError } = await supabase
        .from("projects")
        .update({
          title: form.title.trim(),
          slug: form.slug.trim(),
          short_description: form.short_description.trim(),
          detailed_brief: form.detailed_brief.trim() || null,
          domain: form.domain.trim() || null,
          difficulty: form.difficulty || "Intermediate",
          estimated_hours: Number(form.estimated_hours) || 0,
          learning_objectives: form.learning_objectives as any,
          deliverables: form.deliverables as any,
          evaluation_criteria: form.evaluation_criteria as any,
          instructions: form.instructions.trim() || null,
          resources: form.resources as any,
          mentor_guidance: form.mentor_guidance.trim() || null,
          is_published: form.is_published,
          order_index: Number(form.order_index) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (pError) throw pError;

      // 2. Synchronize career path junctions
      await supabase.from("project_career_paths").delete().eq("project_id", id);
      if (form.career_path_ids && form.career_path_ids.length > 0) {
        const cpInserts = form.career_path_ids.map((cpId, idx) => ({
          project_id: id,
          career_path_id: cpId,
          order_index: idx + 1,
        }));
        await supabase.from("project_career_paths").insert(cpInserts);
      }

      // 3. Synchronize skill junctions
      await supabase.from("project_skills").delete().eq("project_id", id);
      if (form.skill_ids && form.skill_ids.length > 0) {
        const skillInserts = form.skill_ids.map((s, idx) => ({
          project_id: id,
          skill_id: s.skill_id,
          is_primary: s.is_primary,
          order_index: idx + 1,
        }));
        await supabase.from("project_skills").insert(skillInserts);
      }

      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_projects"] });
    },
  });
}

/**
 * Hook to toggle project published status
 */
export function useToggleProjectPublish() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const { data, error } = await supabase
        .from("projects")
        .update({
          is_published: isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_projects"] });
    },
  });
}

/**
 * Hook to duplicate an existing project
 */
export function useDuplicateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceProject: ProjectWithRelations) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const newSlug = `${sourceProject.slug}-copy-${timestamp}`.slice(0, 100);

      // 1. Insert duplicate project row
      const { data: newProject, error: pError } = await supabase
        .from("projects")
        .insert({
          title: `${sourceProject.title} (Copy)`,
          slug: newSlug,
          short_description: sourceProject.short_description,
          detailed_brief: sourceProject.detailed_brief,
          domain: sourceProject.domain,
          difficulty: sourceProject.difficulty,
          estimated_hours: sourceProject.estimated_hours,
          learning_objectives: sourceProject.learning_objectives as any,
          deliverables: sourceProject.deliverables as any,
          evaluation_criteria: sourceProject.evaluation_criteria as any,
          instructions: sourceProject.instructions,
          resources: sourceProject.resources as any,
          mentor_guidance: sourceProject.mentor_guidance,
          is_published: false, // Default to draft for duplicated copies
          order_index: sourceProject.order_index + 1,
        })
        .select()
        .single();

      if (pError) throw pError;
      const newProjectId = newProject.id;

      // 2. Clone career path mappings
      if (sourceProject.career_paths && sourceProject.career_paths.length > 0) {
        const cpInserts = sourceProject.career_paths.map((cp, idx) => ({
          project_id: newProjectId,
          career_path_id: cp.id,
          order_index: idx + 1,
        }));
        await supabase.from("project_career_paths").insert(cpInserts);
      }

      // 3. Clone skill mappings
      if (sourceProject.skills && sourceProject.skills.length > 0) {
        const skillInserts = sourceProject.skills.map((s, idx) => ({
          project_id: newProjectId,
          skill_id: s.id,
          is_primary: s.is_primary,
          order_index: idx + 1,
        }));
        await supabase.from("project_skills").insert(skillInserts);
      }

      return newProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_projects"] });
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      // Check if active submissions exist
      const { count, error: countErr } = await supabase
        .from("project_submissions")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      if (countErr) console.warn("Checking submissions failed:", countErr);

      if (count && count > 0) {
        throw new Error(
          `Cannot delete project because it has ${count} active student submission(s). Unpublish it or archive submissions first.`
        );
      }

      const { error } = await supabase.from("projects").delete().eq("id", projectId);
      if (error) throw error;
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_projects"] });
      queryClient.invalidateQueries({ queryKey: ["project_submissions_summary"] });
    },
  });
}
