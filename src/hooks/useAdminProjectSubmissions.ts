import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  ProjectSubmissionWithDetails,
  ProjectSubmissionRow,
  ProjectSubmissionStatus,
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
 * Fetch all project submissions with full project details, student profiles, and portfolio linkage
 */
export function useAdminProjectSubmissions() {
  return useQuery({
    queryKey: ["admin_project_submissions"],
    queryFn: async (): Promise<ProjectSubmissionWithDetails[]> => {
      // 1. Fetch all submissions from public.project_submissions
      const { data: submissions, error: sError } = await supabase
        .from("project_submissions")
        .select("*")
        .order("submitted_at", { ascending: false });

      if (sError) throw sError;
      if (!submissions || submissions.length === 0) return [];

      const projectIds = Array.from(new Set(submissions.map((s) => s.project_id)));
      const userIds = Array.from(new Set(submissions.map((s) => s.user_id)));
      const submissionIds = submissions.map((s) => s.id);
      const reviewerIds = Array.from(
        new Set(submissions.map((s) => s.reviewed_by).filter(Boolean))
      ) as string[];

      // 2. Fetch associated projects
      let projectMap = new Map<string, any>();
      if (projectIds.length > 0) {
        const { data: projects, error: pError } = await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds);

        if (pError) console.warn("Could not fetch projects for submissions:", pError);
        else {
          projects?.forEach((p) => projectMap.set(p.id, p));
        }
      }

      // 3. Fetch student profiles
      let profileMap = new Map<string, { id: string; user_id: string; full_name: string | null }>();
      if (userIds.length > 0) {
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("id, user_id, full_name")
          .in("user_id", userIds);

        if (profError) console.warn("Could not fetch profiles for submissions:", profError);
        else {
          profiles?.forEach((prof) => profileMap.set(prof.user_id, prof));
        }
      }

      // 4. Fetch reviewer profiles if any
      let reviewerMap = new Map<string, { id: string; user_id: string; full_name: string | null }>();
      if (reviewerIds.length > 0) {
        const { data: reviewers, error: revError } = await supabase
          .from("profiles")
          .select("id, user_id, full_name")
          .in("user_id", reviewerIds);

        if (revError) console.warn("Could not fetch reviewer profiles:", revError);
        else {
          reviewers?.forEach((rev) => reviewerMap.set(rev.user_id, rev));
        }
      }

      // 5. Fetch portfolio items links for these submissions
      let portfolioItemMap = new Map<string, { id: string; portfolio_id: string; is_featured: boolean }>();
      if (submissionIds.length > 0) {
        const { data: pItems, error: piError } = await supabase
          .from("portfolio_items")
          .select("id, portfolio_id, project_submission_id, is_featured")
          .in("project_submission_id", submissionIds);

        if (piError) console.warn("Could not fetch portfolio items for submissions:", piError);
        else {
          pItems?.forEach((pi) => {
            if (pi.project_submission_id) {
              portfolioItemMap.set(pi.project_submission_id, {
                id: pi.id,
                portfolio_id: pi.portfolio_id,
                is_featured: pi.is_featured,
              });
            }
          });
        }
      }

      // 6. Assemble complete records
      return submissions.map((sub: ProjectSubmissionRow): ProjectSubmissionWithDetails => {
        const proj = projectMap.get(sub.project_id);
        const student = profileMap.get(sub.user_id);
        const reviewer = sub.reviewed_by ? reviewerMap.get(sub.reviewed_by) : undefined;
        const portfolioItem = portfolioItemMap.get(sub.id) || null;

        return {
          ...sub,
          status: sub.status as ProjectSubmissionStatus,
          project: proj
            ? {
                id: proj.id,
                title: proj.title,
                slug: proj.slug,
                domain: proj.domain,
                difficulty: proj.difficulty as ProjectDifficulty,
                estimated_hours: proj.estimated_hours,
                short_description: proj.short_description,
                detailed_brief: proj.detailed_brief,
                learning_objectives: parseJsonArray<string>(proj.learning_objectives),
                deliverables: parseJsonArray<ProjectDeliverable>(proj.deliverables),
                evaluation_criteria: parseJsonArray<ProjectEvaluationCriterion>(proj.evaluation_criteria),
                instructions: proj.instructions,
                mentor_guidance: proj.mentor_guidance,
                resources: parseJsonArray<ProjectResource>(proj.resources),
              }
            : undefined,
          student: {
            id: student?.id || sub.user_id,
            user_id: sub.user_id,
            full_name: student?.full_name || null,
          },
          reviewer: reviewer
            ? {
                id: reviewer.id,
                full_name: reviewer.full_name,
              }
            : undefined,
          portfolio_item: portfolioItem,
        };
      });
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Start review on a submitted project (status: submitted -> in_review)
 */
export function useStartReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId }: { submissionId: string }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to review submissions");

      const { data, error } = await supabase
        .from("project_submissions")
        .update({
          status: "in_review",
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_project_submissions"] });
    },
  });
}

/**
 * Approve a project submission (status -> approved)
 */
export function useApproveSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      adminFeedback,
    }: {
      submissionId: string;
      adminFeedback?: string | null;
    }) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to approve submissions");

      const { data, error } = await supabase
        .from("project_submissions")
        .update({
          status: "approved",
          admin_feedback: adminFeedback?.trim() || null,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_project_submissions"] });
    },
  });
}

/**
 * Request revisions on a project submission (status -> revision_required)
 */
export function useRequestRevisionSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      adminFeedback,
    }: {
      submissionId: string;
      adminFeedback: string;
    }) => {
      const trimmed = adminFeedback?.trim() || "";
      if (trimmed.length < 10) {
        throw new Error("Revision feedback must be at least 10 characters explaining what needs revision.");
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required to request revisions");

      const { data, error } = await supabase
        .from("project_submissions")
        .update({
          status: "revision_required",
          admin_feedback: trimmed,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_project_submissions"] });
    },
  });
}

/**
 * Foundation: Make an approved submission available / featured in student's portfolio showcase
 * Strictly maintains is_public = false by default to ensure student privacy.
 */
export function useLinkToPortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      studentUserId,
    }: {
      submissionId: string;
      studentUserId: string;
    }) => {
      // 1. Check if student already has a portfolio
      let { data: portfolio, error: pErr } = await supabase
        .from("portfolios")
        .select("id, user_id, is_public")
        .eq("user_id", studentUserId)
        .maybeSingle();

      if (pErr) throw pErr;

      // 2. If student has no portfolio record yet, initialize private portfolio (is_public = false)
      if (!portfolio) {
        const fallbackSlug = `portfolio-${studentUserId.substring(0, 8)}`;
        const { data: newPortfolio, error: createErr } = await supabase
          .from("portfolios")
          .insert({
            user_id: studentUserId,
            slug: fallbackSlug,
            headline: "Industry Professional Portfolio",
            is_public: false, // Strict privacy guarantee: default to false
          })
          .select()
          .single();

        if (createErr) throw createErr;
        portfolio = newPortfolio;
      }

      // 3. Link the approved submission into portfolio_items
      const { data: existingItem } = await supabase
        .from("portfolio_items")
        .select("id")
        .eq("portfolio_id", portfolio.id)
        .eq("project_submission_id", submissionId)
        .maybeSingle();

      if (!existingItem) {
        const { data: item, error: itemErr } = await supabase
          .from("portfolio_items")
          .insert({
            portfolio_id: portfolio.id,
            project_submission_id: submissionId,
            is_featured: true,
            order_index: 0,
          })
          .select()
          .single();

        if (itemErr) throw itemErr;
        return item;
      }

      return existingItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_project_submissions"] });
    },
  });
}
