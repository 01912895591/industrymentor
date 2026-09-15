import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Courses from "@/pages/Courses";
import { describe, it, expect, vi } from "vitest";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: "e373dcce-54fb-4a55-8070-54543691fedb",
                title: "Garments Merchandising-from-order-to-shipment-excellence",
                slug: "from-order-to-shipment-excellence",
                description: "Order থেকে Shipment পর্যন্ত পুরো Merchandising process",
                price_cents: 500000,
                old_price_cents: 1500000,
                cover_image_path: "https://fiirnhpsldouvnfvbtun.supabase.co/storage/v1/object/public/site_assets/course-cover-1772348053034.webp",
                mode: "online",
                rating: 5,
                reviews: 95,
                badge_text: "Professional",
                instructor_heading: "Taught by Experts",
                instructor_subheading: "Industry Professionals",
                published: true,
                created_at: "2026-03-01T06:55:10.162498+00:00",
              },
            ],
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe("Courses Page", () => {
  it("renders without crashing", async () => {
    render(
      <BrowserRouter>
        <Courses />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Practical Industry Curriculum/i)).toBeDefined();
    });
  });
});
