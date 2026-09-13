import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CareerPathRow = Database["public"]["Tables"]["career_paths"]["Row"];
export type SkillRow = Database["public"]["Tables"]["skills"]["Row"];
export type CareerPathSkillRow = Database["public"]["Tables"]["career_path_skills"]["Row"];
export type SkillCourseRow = Database["public"]["Tables"]["skill_courses"]["Row"];
export type SkillMentorRow = Database["public"]["Tables"]["skill_mentors"]["Row"];
export type SkillLibraryItemRow = Database["public"]["Tables"]["skill_library_items"]["Row"];

/**
 * Hook to fetch published career paths from Supabase
 */
export function useCareerPaths() {
  return useQuery({
    queryKey: ["career_paths"],
    queryFn: async (): Promise<CareerPathRow[]> => {
      const { data, error } = await supabase
        .from("career_paths")
        .select("*")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 1,
  });
}

/**
 * Hook to fetch published skills from Supabase
 */
export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async (): Promise<SkillRow[]> => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("is_published", true)
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to fetch career path <-> skill mappings
 */
export function useCareerPathSkills(careerPathId?: string) {
  return useQuery({
    queryKey: ["career_path_skills", careerPathId],
    queryFn: async (): Promise<CareerPathSkillRow[]> => {
      let query = supabase
        .from("career_path_skills")
        .select("*")
        .order("order_index", { ascending: true });

      if (careerPathId) {
        query = query.eq("career_path_id", careerPathId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to fetch skill <-> course mappings
 */
export function useSkillCourses(skillId?: string) {
  return useQuery({
    queryKey: ["skill_courses", skillId],
    queryFn: async (): Promise<SkillCourseRow[]> => {
      let query = supabase
        .from("skill_courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (skillId) {
        query = query.eq("skill_id", skillId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to fetch skill <-> mentor mappings
 */
export function useSkillMentors(skillId?: string) {
  return useQuery({
    queryKey: ["skill_mentors", skillId],
    queryFn: async (): Promise<SkillMentorRow[]> => {
      let query = supabase
        .from("skill_mentors")
        .select("*")
        .order("order_index", { ascending: true });

      if (skillId) {
        query = query.eq("skill_id", skillId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

/**
 * Hook to fetch skill <-> library item mappings
 */
export function useSkillLibraryItems(skillId?: string) {
  return useQuery({
    queryKey: ["skill_library_items", skillId],
    queryFn: async (): Promise<SkillLibraryItemRow[]> => {
      let query = supabase
        .from("skill_library_items")
        .select("*")
        .order("order_index", { ascending: true });

      if (skillId) {
        query = query.eq("skill_id", skillId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

// ============================================================================
// ADMIN QUERIES & MUTATIONS (Includes all records, draft & published)
// ============================================================================

export type CareerPathInsert = Database["public"]["Tables"]["career_paths"]["Insert"];
export type CareerPathUpdate = Database["public"]["Tables"]["career_paths"]["Update"];
export type SkillInsert = Database["public"]["Tables"]["skills"]["Insert"];
export type SkillUpdate = Database["public"]["Tables"]["skills"]["Update"];
export type CareerPathSkillInsert = Database["public"]["Tables"]["career_path_skills"]["Insert"];
export type SkillCourseInsert = Database["public"]["Tables"]["skill_courses"]["Insert"];
export type SkillMentorInsert = Database["public"]["Tables"]["skill_mentors"]["Insert"];
export type SkillLibraryItemInsert = Database["public"]["Tables"]["skill_library_items"]["Insert"];

export type CourseOption = Pick<Database["public"]["Tables"]["courses"]["Row"], "id" | "title" | "slug" | "price_cents" | "published">;
export type MentorOption = Pick<Database["public"]["Tables"]["mentors"]["Row"], "id" | "name" | "title" | "bio" | "tags">;
export type LibraryItemOption = Pick<Database["public"]["Tables"]["library_items"]["Row"], "id" | "title" | "item_key" | "item_type" | "category" | "published">;

/**
 * Hook to fetch ALL career paths for admin (both published and drafts)
 */
export function useAdminCareerPaths() {
  return useQuery({
    queryKey: ["admin_career_paths"],
    queryFn: async (): Promise<CareerPathRow[]> => {
      const { data, error } = await supabase
        .from("career_paths")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to fetch ALL skills for admin (both published and drafts)
 */
export function useAdminSkills() {
  return useQuery({
    queryKey: ["admin_skills"],
    queryFn: async (): Promise<SkillRow[]> => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch all career path <-> skills mappings for admin
 */
export function useAdminCareerPathSkills() {
  return useQuery({
    queryKey: ["admin_career_path_skills"],
    queryFn: async (): Promise<CareerPathSkillRow[]> => {
      const { data, error } = await supabase
        .from("career_path_skills")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch all skill <-> course mappings for admin
 */
export function useAdminSkillCourses() {
  return useQuery({
    queryKey: ["admin_skill_courses"],
    queryFn: async (): Promise<SkillCourseRow[]> => {
      const { data, error } = await supabase
        .from("skill_courses")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch all skill <-> mentor mappings for admin
 */
export function useAdminSkillMentors() {
  return useQuery({
    queryKey: ["admin_skill_mentors"],
    queryFn: async (): Promise<SkillMentorRow[]> => {
      const { data, error } = await supabase
        .from("skill_mentors")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch all skill <-> library item mappings for admin
 */
export function useAdminSkillLibraryItems() {
  return useQuery({
    queryKey: ["admin_skill_library_items"],
    queryFn: async (): Promise<SkillLibraryItemRow[]> => {
      const { data, error } = await supabase
        .from("skill_library_items")
        .select("*")
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to fetch real courses for association dropdowns
 */
export function useAdminCourses() {
  return useQuery({
    queryKey: ["admin_courses_lookup"],
    queryFn: async (): Promise<CourseOption[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, slug, price_cents, published")
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch real mentors for association dropdowns
 */
export function useAdminMentors() {
  return useQuery({
    queryKey: ["admin_mentors_lookup"],
    queryFn: async (): Promise<MentorOption[]> => {
      const { data, error } = await supabase
        .from("mentors")
        .select("id, name, title, bio, tags")
        .order("name", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch real library items for association dropdowns
 */
export function useAdminLibraryItems() {
  return useQuery({
    queryKey: ["admin_library_items_lookup"],
    queryFn: async (): Promise<LibraryItemOption[]> => {
      const { data, error } = await supabase
        .from("library_items")
        .select("id, title, item_key, item_type, category, published")
        .order("title", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 5,
  });
}

