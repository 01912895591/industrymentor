import { describe, it, expect } from "vitest";
import { isValidHttpsUrl } from "@/pages/ProjectWorkspace";
import type { ProjectSubmissionRow } from "@/types/projects";

describe("Project Submissions & Workspace Lifecycle", () => {
  describe("HTTPS URL Security Validation", () => {
    it("accepts valid HTTPS links from common platforms", () => {
      expect(isValidHttpsUrl("https://github.com/student/apparel-tna-project")).toBe(true);
      expect(isValidHttpsUrl("https://docs.google.com/spreadsheets/d/123456789/edit")).toBe(true);
      expect(isValidHttpsUrl("https://loom.com/share/abc123def456")).toBe(true);
      expect(isValidHttpsUrl("https://www.figma.com/file/xyz/Design-System")).toBe(true);
      expect(isValidHttpsUrl("https://my-portfolio-domain.com/projects/export-tracker")).toBe(true);
    });

    it("rejects non-HTTPS and insecure URLs", () => {
      expect(isValidHttpsUrl("http://insecure-site.com/deliverable")).toBe(false);
      expect(isValidHttpsUrl("http://github.com/user/project")).toBe(false);
    });

    it("rejects dangerous URI schemes (XSS vectors)", () => {
      expect(isValidHttpsUrl("javascript:alert(document.domain)")).toBe(false);
      expect(isValidHttpsUrl("javascript:void(0)")).toBe(false);
      expect(isValidHttpsUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
      expect(isValidHttpsUrl("file:///C:/Users/Secret/data.txt")).toBe(false);
      expect(isValidHttpsUrl("ftp://ftp.example.com/files")).toBe(false);
    });

    it("rejects malformed, empty, or whitespace-only inputs", () => {
      expect(isValidHttpsUrl("")).toBe(false);
      expect(isValidHttpsUrl("   ")).toBe(false);
      expect(isValidHttpsUrl("not-a-url")).toBe(false);
      expect(isValidHttpsUrl("https://")).toBe(false);
    });
  });

  describe("Submission Status Types and Lifecycles", () => {
    it("verifies submission row structure for 'submitted' state", () => {
      const submission: ProjectSubmissionRow = {
        id: "sub-1",
        project_id: "proj-1",
        user_id: "user-1",
        title: "Garment Sourcing Plan v1",
        deliverable_url: "https://docs.google.com/spreadsheets/d/abc",
        submission_notes: "Completed all 6 delivery milestones.",
        status: "submitted",
        admin_feedback: null,
        reviewed_by: null,
        reviewed_at: null,
        created_at: "2026-09-12T10:00:00Z",
        updated_at: "2026-09-12T10:00:00Z",
      };

      expect(submission.status).toBe("submitted");
      expect(submission.admin_feedback).toBeNull();
      expect(submission.reviewed_by).toBeNull();
      expect(isValidHttpsUrl(submission.deliverable_url)).toBe(true);
    });

    it("verifies submission row structure for 'revision_required' state with admin feedback", () => {
      const submission: ProjectSubmissionRow = {
        id: "sub-2",
        project_id: "proj-1",
        user_id: "user-1",
        title: "Garment Sourcing Plan v1",
        deliverable_url: "https://docs.google.com/spreadsheets/d/abc",
        submission_notes: "Initial submission",
        status: "revision_required",
        admin_feedback: "Please add standard buffer lead times for lab-dip approvals in column G.",
        reviewed_by: "admin-reviewer-1",
        reviewed_at: "2026-09-12T11:30:00Z",
        created_at: "2026-09-12T10:00:00Z",
        updated_at: "2026-09-12T11:30:00Z",
      };

      expect(submission.status).toBe("revision_required");
      expect(submission.admin_feedback).toContain("buffer lead times");
      expect(submission.reviewed_by).toBe("admin-reviewer-1");
    });

    it("verifies submission row structure for 'approved' state", () => {
      const submission: ProjectSubmissionRow = {
        id: "sub-3",
        project_id: "proj-1",
        user_id: "user-1",
        title: "Garment Sourcing Plan v2",
        deliverable_url: "https://docs.google.com/spreadsheets/d/abc-v2",
        submission_notes: "Updated with requested lead times.",
        status: "approved",
        admin_feedback: "Excellent work! The revised lead time buffers reflect actual factory practice.",
        reviewed_by: "admin-reviewer-1",
        reviewed_at: "2026-09-12T12:00:00Z",
        created_at: "2026-09-12T10:00:00Z",
        updated_at: "2026-09-12T12:00:00Z",
      };

      expect(submission.status).toBe("approved");
      expect(submission.admin_feedback).toContain("Excellent work!");
      expect(submission.reviewed_at).toBeDefined();
    });
  });
});
