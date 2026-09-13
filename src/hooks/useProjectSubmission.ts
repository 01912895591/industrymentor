import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ProjectSubmissionRow, ProjectSubmissionFormData } from "@/types/projects";

/**
 * Hook to fetch the authenticated student's submission for a specific project
 * Relies strictly on Supabase Auth context and RLS (auth.uid() = user_id)
 */
export function useProjectSubmission(projectId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["project_submission", projectId, user?.id],
    queryFn: async (): Promise<ProjectSubmissionRow | null> => {
      if (!user || !projectId) return null;

      const { data, error } = await supabase
        .from("project_submissions")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as ProjectSubmissionRow) || null;
    },
    enabled: Boolean(user && projectId),
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to create a student's initial project submission
 * Sets status to 'submitted' per database RLS WITH CHECK policy
 */
export function useSubmitProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      form,
    }: {
      projectId: string;
      form: ProjectSubmissionFormData;
    }) => {
      if (!user) throw new Error("Authentication required to submit work");

      const { data, error } = await supabase
        .from("project_submissions")
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: form.title.trim(),
          submission_notes: form.submission_notes.trim() || null,
          deliverable_url: form.deliverable_url.trim(),
          status: "submitted",
          submitted_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ProjectSubmissionRow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_submission", variables.projectId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_submissions_summary"],
      });
    },
  });
}

/**
 * Hook to resubmit / update an existing submission
 * Allowed when status is 'submitted' or 'revision_required'
 * Resets review fields to null and sets status to 'submitted' per database RLS WITH CHECK policy
 */
export function useResubmitProject() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      submissionId,
      projectId,
      form,
    }: {
      submissionId: string;
      projectId: string;
      form: ProjectSubmissionFormData;
    }) => {
      if (!user) throw new Error("Authentication required to resubmit work");

      const { data, error } = await supabase
        .from("project_submissions")
        .update({
          title: form.title.trim(),
          submission_notes: form.submission_notes.trim() || null,
          deliverable_url: form.deliverable_url.trim(),
          status: "submitted",
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reviewed_by: null,
          reviewed_at: null,
          admin_feedback: null,
        })
        .eq("id", submissionId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ProjectSubmissionRow;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project_submission", variables.projectId, user?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project_submissions_summary"],
      });
    },
  });
}
