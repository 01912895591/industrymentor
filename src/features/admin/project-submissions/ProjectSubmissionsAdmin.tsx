import React, { useState, useEffect, useMemo } from "react";
import { ProjectSubmissionStatsHeader } from "./ProjectSubmissionStatsHeader";
import {
  ProjectSubmissionFilters,
  ProjectSubmissionFilterState,
} from "./ProjectSubmissionFilters";
import { ProjectSubmissionsTable } from "./ProjectSubmissionsTable";
import { ProjectSubmissionReviewDialog } from "./ProjectSubmissionReviewDialog";
import {
  useAdminProjectSubmissions,
  useStartReviewSubmission,
} from "@/hooks/useAdminProjectSubmissions";
import type { ProjectSubmissionWithDetails } from "@/types/projects";
import { toast } from "sonner";

export function ProjectSubmissionsAdmin() {
  // SEO Page Title
  useEffect(() => {
    document.title = "Project Submissions Review | IndustryMentor Admin";
  }, []);

  // Data Fetching
  const {
    data: submissions = [],
    isLoading,
    refetch,
  } = useAdminProjectSubmissions();

  const startReviewMutation = useStartReviewSubmission();

  // Dialog State
  const [selectedSubmission, setSelectedSubmission] =
    useState<ProjectSubmissionWithDetails | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<ProjectSubmissionFilterState>({
    search: "",
    status: "all",
    projectId: "all",
    sortBy: "newest",
  });

  // Unique Projects for filtering dropdown
  const uniqueProjects = useMemo(() => {
    const map = new Map<string, string>();
    submissions.forEach((s) => {
      if (s.project?.id && s.project.title) {
        map.set(s.project.id, s.project.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [submissions]);

  // Filtered & Sorted Submissions
  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    // 1. Search Query
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((s) => {
        const studentName = s.student?.full_name?.toLowerCase() || "";
        const userId = s.user_id.toLowerCase();
        const subTitle = s.title?.toLowerCase() || "";
        const projTitle = s.project?.title?.toLowerCase() || "";

        return (
          studentName.includes(q) ||
          userId.includes(q) ||
          subTitle.includes(q) ||
          projTitle.includes(q)
        );
      });
    }

    // 2. Status Filter
    if (filters.status !== "all") {
      result = result.filter((s) => s.status === filters.status);
    }

    // 3. Project Filter
    if (filters.projectId !== "all") {
      result = result.filter((s) => s.project_id === filters.projectId);
    }

    // 4. Sorting
    result.sort((a, b) => {
      if (filters.sortBy === "newest") {
        const dateA = new Date(a.submitted_at || a.created_at).getTime();
        const dateB = new Date(b.submitted_at || b.created_at).getTime();
        return dateB - dateA;
      }
      if (filters.sortBy === "oldest") {
        const dateA = new Date(a.submitted_at || a.created_at).getTime();
        const dateB = new Date(b.submitted_at || b.created_at).getTime();
        return dateA - dateB;
      }
      if (filters.sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return result;
  }, [submissions, filters]);

  // Synchronize selectedSubmission with latest data from query
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find((s) => s.id === selectedSubmission.id);
      if (updated) {
        setSelectedSubmission(updated);
      }
    }
  }, [submissions]);

  const handleReviewClick = (submission: ProjectSubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setReviewDialogOpen(true);
  };

  const handleStartReviewQuick = async (
    submission: ProjectSubmissionWithDetails
  ) => {
    try {
      await startReviewMutation.mutateAsync({ submissionId: submission.id });
      toast.success("Review initiated. Opening evaluation workspace...");
      setSelectedSubmission(submission);
      setReviewDialogOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to start review");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Metrics Header */}
      <ProjectSubmissionStatsHeader
        submissions={submissions}
        isLoading={isLoading}
        onRefresh={() => refetch()}
      />

      {/* Search and Filters */}
      <ProjectSubmissionFilters
        filters={filters}
        onChange={setFilters}
        uniqueProjects={uniqueProjects}
        totalCount={submissions.length}
        filteredCount={filteredSubmissions.length}
      />

      {/* Submissions Data Table */}
      <ProjectSubmissionsTable
        submissions={filteredSubmissions}
        isLoading={isLoading}
        onReviewClick={handleReviewClick}
        onStartReviewClick={handleStartReviewQuick}
      />

      {/* Detailed Evaluation Workspace Dialog */}
      <ProjectSubmissionReviewDialog
        submission={selectedSubmission}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      />
    </div>
  );
}
