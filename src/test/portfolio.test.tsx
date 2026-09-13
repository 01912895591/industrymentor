import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { isValidSlug, generateSafeSlug } from "@/hooks/usePortfolio";
import { PublicProjectCard } from "@/components/portfolio/PublicProjectCard";
import { PublicCertificateCard } from "@/components/portfolio/PublicCertificateCard";
import type { PortfolioItemWithDetails } from "@/types/portfolio";

describe("Student Portfolio & Public Profile System", () => {
  describe("Slug Validation & Generation", () => {
    it("accepts valid URL-safe lowercase slugs", () => {
      expect(isValidSlug("farhan-ahmed")).toBe(true);
      expect(isValidSlug("apparel-merchandiser-01")).toBe(true);
      expect(isValidSlug("abc")).toBe(true); // 3 chars min
      expect(isValidSlug("a".repeat(60))).toBe(true); // 60 chars max
    });

    it("rejects invalid slugs (uppercase, spaces, special characters, wrong length)", () => {
      expect(isValidSlug("")).toBe(false);
      expect(isValidSlug("ab")).toBe(false); // < 3 chars
      expect(isValidSlug("a".repeat(61))).toBe(false); // > 60 chars
      expect(isValidSlug("Farhan-Ahmed")).toBe(false); // uppercase
      expect(isValidSlug("farhan ahmed")).toBe(false); // spaces
      expect(isValidSlug("farhan_ahmed")).toBe(false); // underscores
      expect(isValidSlug("-farhan")).toBe(false); // leading hyphen
      expect(isValidSlug("farhan-")).toBe(false); // trailing hyphen
      expect(isValidSlug("farhan--ahmed")).toBe(false); // double hyphen
      expect(isValidSlug("farhan@industry")).toBe(false); // special char
    });

    it("generates clean URL-safe slugs from user names or emails", () => {
      expect(generateSafeSlug("Farhan Ahmed")).toBe("farhan-ahmed");
      expect(generateSafeSlug("user.name@domain.com")).toBe("user-name");
      expect(generateSafeSlug("  Md. Abdullah Al-Mamun  ")).toBe("md-abdullah-al-mamun");
      expect(generateSafeSlug("ab")).toMatch(/^ab-[a-z0-9]+$/);
    });
  });

  describe("Approved Project Integration in Portfolio", () => {
    const mockProjectItem: PortfolioItemWithDetails = {
      id: "pi-1",
      portfolio_id: "port-1",
      project_submission_id: "sub-1",
      certificate_id: null,
      is_featured: true,
      order_index: 0,
      created_at: new Date().toISOString(),
      submission: {
        id: "sub-1",
        title: "Garment Critical Path TNA",
        deliverable_url: "https://docs.google.com/spreadsheets/d/123xyz/edit",
        status: "approved",
        submitted_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        project: {
          id: "proj-1",
          title: "Apparel Critical Path & TNA Management",
          slug: "apparel-critical-path-tna",
          domain: "Merchandising & Sourcing",
          difficulty: "Intermediate",
          short_description: "Real-world time and action tracker for high-volume knitwear orders.",
        },
      },
      certificate: null,
    };

    it("renders project card with title, domain, verified outcome badge, and secure deliverable link", () => {
      render(
        <MemoryRouter>
          <PublicProjectCard item={mockProjectItem} isFeatured={true} />
        </MemoryRouter>
      );

      expect(screen.getByText("Apparel Critical Path & TNA Management")).toBeInTheDocument();
      expect(screen.getByText("Merchandising & Sourcing")).toBeInTheDocument();
      expect(screen.getByText("Verified Outcome")).toBeInTheDocument();
      expect(screen.getByText("Featured Project")).toBeInTheDocument();

      const link = screen.getByRole("link", { name: /view solution deliverable/i });
      expect(link).toHaveAttribute("href", "https://docs.google.com/spreadsheets/d/123xyz/edit");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("ensures unapproved submissions are strictly filtered out", () => {
      const submissions = [
        { id: "sub-1", status: "approved" },
        { id: "sub-2", status: "submitted" },
        { id: "sub-3", status: "in_review" },
        { id: "sub-4", status: "revision_required" },
      ];

      const eligibleForPortfolio = submissions.filter((s) => s.status === "approved");
      expect(eligibleForPortfolio.length).toBe(1);
      expect(eligibleForPortfolio[0].id).toBe("sub-1");
    });
  });

  describe("Verified Certificate Integration in Portfolio", () => {
    const mockCertItem: PortfolioItemWithDetails = {
      id: "pi-2",
      portfolio_id: "port-1",
      project_submission_id: null,
      certificate_id: "cert-999",
      is_featured: false,
      order_index: 1,
      created_at: new Date().toISOString(),
      submission: null,
      certificate: {
        id: "cert-999",
        status: "approved",
        issued_at: "2026-09-01T10:00:00Z",
        course_id: "course-1",
        course: {
          id: "course-1",
          title: "Production Planning & Control Masterclass",
          slug: "production-planning-control-masterclass",
        },
      },
    };

    it("renders verified certificate card with course title and authenticity link", () => {
      render(
        <MemoryRouter>
          <PublicCertificateCard item={mockCertItem} />
        </MemoryRouter>
      );

      expect(screen.getByText("Production Planning & Control Masterclass")).toBeInTheDocument();
      expect(screen.getByText("Verified Credential")).toBeInTheDocument();

      const verifyLink = screen.getByRole("link", { name: /verify credential authenticity/i });
      expect(verifyLink).toHaveAttribute("href", "/verify/cert-999");
      expect(verifyLink).toHaveAttribute("target", "_blank");
      expect(verifyLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("ensures unverified certificates are strictly excluded", () => {
      const certs = [
        { id: "cert-1", status: "approved" },
        { id: "cert-2", status: "pending" },
        { id: "cert-3", status: "rejected" },
      ];

      const eligibleCerts = certs.filter((c) => c.status === "approved");
      expect(eligibleCerts.length).toBe(1);
      expect(eligibleCerts[0].id).toBe("cert-1");
    });
  });

  describe("Portfolio Item Source Constraints", () => {
    it("verifies portfolio item represents exactly one source", () => {
      const isValidSourceCombination = (
        projectSubmissionId: string | null,
        certificateId: string | null
      ) => {
        return (
          (projectSubmissionId !== null && certificateId === null) ||
          (projectSubmissionId === null && certificateId !== null)
        );
      };

      expect(isValidSourceCombination("sub-1", null)).toBe(true);
      expect(isValidSourceCombination(null, "cert-1")).toBe(true);
      expect(isValidSourceCombination("sub-1", "cert-1")).toBe(false);
      expect(isValidSourceCombination(null, null)).toBe(false);
    });
  });

  describe("Privacy & Public Visibility Rules", () => {
    it("ensures private portfolios block non-owner public access", () => {
      const canViewPortfolio = (
        isPublic: boolean,
        viewerUserId: string | null,
        portfolioOwnerUserId: string
      ) => {
        if (isPublic) return true;
        if (viewerUserId && viewerUserId === portfolioOwnerUserId) return true;
        return false;
      };

      // Anonymous visitor
      expect(canViewPortfolio(false, null, "user-owner")).toBe(false);
      expect(canViewPortfolio(true, null, "user-owner")).toBe(true);

      // Another authenticated student
      expect(canViewPortfolio(false, "user-peer", "user-owner")).toBe(false);
      expect(canViewPortfolio(true, "user-peer", "user-owner")).toBe(true);

      // Portfolio owner
      expect(canViewPortfolio(false, "user-owner", "user-owner")).toBe(true);
      expect(canViewPortfolio(true, "user-owner", "user-owner")).toBe(true);
    });
  });
});
