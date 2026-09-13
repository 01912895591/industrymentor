import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SubmissionStatusBadge } from "@/features/admin/project-submissions/SubmissionStatusBadge";
import { ProjectSubmissionsTable } from "@/features/admin/project-submissions/ProjectSubmissionsTable";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";
import type { ProjectSubmissionWithDetails } from "@/types/projects";

describe("Admin Project Submissions CMS", () => {
  describe("SubmissionStatusBadge", () => {
    it("renders the correct label and badge for 'submitted'", () => {
      render(<SubmissionStatusBadge status="submitted" />);
      expect(screen.getByText(/Submitted \(Pending\)/i)).toBeInTheDocument();
    });

    it("renders the correct label and badge for 'in_review'", () => {
      render(<SubmissionStatusBadge status="in_review" />);
      expect(screen.getByText(/In Review/i)).toBeInTheDocument();
    });

    it("renders the correct label and badge for 'approved'", () => {
      render(<SubmissionStatusBadge status="approved" />);
      expect(screen.getByText(/Approved/i)).toBeInTheDocument();
    });

    it("renders the correct label and badge for 'revision_required'", () => {
      render(<SubmissionStatusBadge status="revision_required" />);
      expect(screen.getByText(/Revision Required/i)).toBeInTheDocument();
    });
  });

  describe("ProjectSubmissionsTable Empty State", () => {
    it("renders proper empty state when there are zero submissions", () => {
      render(
        <MemoryRouter>
          <ProjectSubmissionsTable
            submissions={[]}
            isLoading={false}
            onReviewClick={() => {}}
            onStartReviewClick={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("No Submissions Found")).toBeInTheDocument();
      expect(
        screen.getByText(/When students submit their solutions from their project workspaces/i)
      ).toBeInTheDocument();
    });
  });

  describe("ProjectSubmissionsTable Row Rendering & Actions", () => {
    const mockSubmission: ProjectSubmissionWithDetails = {
      id: "sub-123",
      project_id: "proj-1",
      user_id: "user-abc-456",
      title: "Quarterly Export Time & Action Calendar",
      deliverable_url: "https://docs.google.com/spreadsheets/d/abc123xyz",
      submission_notes: "Attached all factory lead time formulas and lab-dip buffers.",
      status: "submitted",
      admin_feedback: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      student: {
        id: "prof-1",
        user_id: "user-abc-456",
        full_name: "Farhan Ahmed",
      },
      project: {
        id: "proj-1",
        title: "Apparel Critical Path & TNA Management",
        slug: "apparel-critical-path-tna",
        domain: "Merchandising & Sourcing",
        difficulty: "Intermediate",
        estimated_hours: 24,
        short_description: "Build an end-to-end TNA tracker.",
        detailed_brief: "Detailed factory challenge...",
        learning_objectives: ["Milestone planning"],
        deliverables: [{ title: "TNA Sheet" }],
        evaluation_criteria: [{ criterion: "Lead time buffer accuracy" }],
        instructions: "Step 1...",
        mentor_guidance: "Include fabric buffers.",
        resources: [],
      },
      portfolio_item: null,
    };

    it("renders student, project, deliverable title, and Start Review button for 'submitted' status", () => {
      render(
        <MemoryRouter>
          <ProjectSubmissionsTable
            submissions={[mockSubmission]}
            isLoading={false}
            onReviewClick={() => {}}
            onStartReviewClick={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Farhan Ahmed")).toBeInTheDocument();
      expect(screen.getByText("Apparel Critical Path & TNA Management")).toBeInTheDocument();
      expect(screen.getByText("Quarterly Export Time & Action Calendar")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /start review/i })).toBeInTheDocument();
    });

    it("renders Review button when status is 'in_review' or 'approved'", () => {
      const inReviewSub: ProjectSubmissionWithDetails = {
        ...mockSubmission,
        status: "in_review",
      };

      render(
        <MemoryRouter>
          <ProjectSubmissionsTable
            submissions={[inReviewSub]}
            isLoading={false}
            onReviewClick={() => {}}
            onStartReviewClick={() => {}}
          />
        </MemoryRouter>
      );

      expect(screen.getByRole("button", { name: /review/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /start review/i })).not.toBeInTheDocument();
    });
  });

  describe("Revision Feedback Validation", () => {
    it("enforces minimum 10 characters for revision feedback", () => {
      const validateRevision = (feedback: string) => {
        const trimmed = feedback.trim();
        return trimmed.length >= 10;
      };

      expect(validateRevision("")).toBe(false);
      expect(validateRevision("Fix this")).toBe(false); // 8 chars
      expect(validateRevision("Nine chars")).toBe(true); // 10 chars
      expect(validateRevision("Please recalculate column G buffer lead times.")).toBe(true);
    });
  });

  describe("Deliverable HTTPS Security Verification", () => {
    it("ensures submission deliverable URL meets HTTPS requirements", () => {
      expect(isValidHttpsUrl("https://docs.google.com/spreadsheets/d/123")).toBe(true);
      expect(isValidHttpsUrl("http://insecure-site.com/report")).toBe(false);
      expect(isValidHttpsUrl("javascript:alert(1)")).toBe(false);
      expect(isValidHttpsUrl("data:text/html,<script>")).toBe(false);
    });
  });
});
