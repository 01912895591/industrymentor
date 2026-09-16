import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import VerifyCertificate from "@/pages/VerifyCertificate";

// Mock supabase client
vi.mock("@integrations/supabase/client", () => {
  return {
    supabase: {
      rpc: vi.fn(),
      from: vi.fn(),
    },
  };
});

// Mock SEOHead
vi.mock("@/components/seo/SEOHead", () => ({
  SEOHead: () => null,
}));

describe("VerifyCertificate Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders certificate search interface by default", () => {
    render(
      <MemoryRouter initialEntries={["/verify"]}>
        <Routes>
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/verify/:id" element={<VerifyCertificate />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Certificate Verification")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 9A0FF246/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify credential/i })).toBeInTheDocument();
  });

  it("successfully displays verified certificate details from API for short ID", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        verified: true,
        data: {
          id: "9a0ff246-9646-43bb-a087-073d08cd9848",
          shortId: "9A0FF246",
          studentName: "Abdullah Al Mamun",
          courseTitle: "Garment Merchandising & Production Management",
          issuedAt: "2026-09-15T00:00:00.000Z",
          status: "approved",
          issuer: "IndustryMentor (industrymentor.net)",
        },
      }),
    });

    render(
      <MemoryRouter initialEntries={["/verify/9A0FF246"]}>
        <Routes>
          <Route path="/verify/:id" element={<VerifyCertificate />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/✓ Verified Official Certificate/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Abdullah Al Mamun")).toBeInTheDocument();
    expect(screen.getByText("Garment Merchandising & Production Management")).toBeInTheDocument();
    expect(screen.getByText("9A0FF246")).toBeInTheDocument();
    expect(screen.getByText(/September 15, 2026/i)).toBeInTheDocument();
  });

  it("displays invalid certificate message when certificate is not found (404)", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        success: false,
        error: "Certificate not found",
        verified: false,
      }),
    });

    render(
      <MemoryRouter initialEntries={["/verify/INVALID88"]}>
        <Routes>
          <Route path="/verify/:id" element={<VerifyCertificate />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/✗ Not Found — Invalid Certificate/i).length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/No approved credential was found for this ID/i)).toBeInTheDocument();
  });

  it("displays rate limit warning when receiving HTTP 429", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({
        success: false,
        error: "Too many verification requests",
        rateLimited: true,
      }),
    });

    render(
      <MemoryRouter initialEntries={["/verify/9A0FF246"]}>
        <Routes>
          <Route path="/verify/:id" element={<VerifyCertificate />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Rate Limit Notice/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Too many certificate lookup requests/i)).toBeInTheDocument();
  });
});
