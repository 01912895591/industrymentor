import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectWithRelations } from "@/types/projects";

describe("ProjectCard", () => {
  const mockProject: ProjectWithRelations = {
    id: "test-proj-uuid-1",
    slug: "apparel-critical-path-tna",
    title: "Apparel Critical Path & TNA Management",
    short_description: "Build an end-to-end Time and Action tracker for high-volume knitwear export orders.",
    detailed_brief: "Factory challenge details...",
    domain: "Merchandising & Sourcing",
    difficulty: "Intermediate",
    estimated_hours: 24,
    learning_objectives: ["Understand critical path milestones"],
    deliverables: [{ title: "TNA Excel Tracker" }],
    evaluation_criteria: [{ criterion: "Accuracy of buffer lead times" }],
    instructions: "Step by step instructions...",
    resources: [{ title: "Buyer Calendar Sample" }],
    mentor_guidance: "Always include fabric lab-dip buffer days.",
    is_published: true,
    order_index: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    career_paths: [
      {
        id: "cp-1",
        title: "Garment Merchandising & Supply Execution",
        slug: "garment-merchandising-supply-execution",
        domain: "Merchandising",
      },
    ],
    skills: [
      {
        id: "sk-1",
        title: "Order-to-Shipment Execution & TNA",
        slug: "order-to-shipment-execution-tna",
        is_primary: true,
      },
      {
        id: "sk-2",
        title: "Buyer Negotiation & Costing Breakdown",
        slug: "buyer-negotiation-costing-breakdown",
        is_primary: false,
      },
    ],
  };

  it("renders the project title, description, domain, and difficulty", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={mockProject} />
      </MemoryRouter>
    );

    expect(screen.getByText("Apparel Critical Path & TNA Management")).toBeInTheDocument();
    expect(screen.getByText(/Build an end-to-end Time and Action tracker/)).toBeInTheDocument();
    expect(screen.getByText("Merchandising & Sourcing")).toBeInTheDocument();
    expect(screen.getByText("Intermediate")).toBeInTheDocument();
    expect(screen.getByText("24 hrs estimated")).toBeInTheDocument();
  });

  it("renders associated career path and primary skills", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={mockProject} />
      </MemoryRouter>
    );

    expect(screen.getByText("Garment Merchandising & Supply Execution")).toBeInTheDocument();
    expect(screen.getByText("Order-to-Shipment Execution & TNA")).toBeInTheDocument();
  });

  it("renders link to the project detail page", () => {
    render(
      <MemoryRouter>
        <ProjectCard project={mockProject} />
      </MemoryRouter>
    );

    const ctaLink = screen.getByRole("link", { name: /view project/i });
    expect(ctaLink).toHaveAttribute("href", "/projects/apparel-critical-path-tna");
  });
});
