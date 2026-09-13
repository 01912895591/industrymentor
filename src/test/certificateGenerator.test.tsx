import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import React from "react";
import { CertificateGenerator } from "@/features/certificates/CertificateGenerator";
import jsPDF from "jspdf";

// Mock html2canvas for the jsdom test environment
vi.mock("html2canvas", () => {
  return {
    default: vi.fn().mockImplementation(async () => {
      return {
        toDataURL: vi.fn().mockReturnValue("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
      };
    })
  };
});

// Mock qrcode toDataURL
vi.mock("qrcode", () => {
  return {
    default: {
      toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,dummy-qr-data")
    }
  };
});

// Setup spies for jsPDF instance methods
const mockSave = vi.fn();
const mockAddImage = vi.fn();

vi.mock("jspdf", () => {
  return {
    default: class MockJsPDF {
      internal = {
        pageSize: {
          getWidth: () => 297,
          getHeight: () => 210,
        },
      };
      addImage = mockAddImage;
      save = mockSave;
    },
    jsPDF: class MockJsPDF {
      internal = {
        pageSize: {
          getWidth: () => 297,
          getHeight: () => 210,
        },
      };
      addImage = mockAddImage;
      save = mockSave;
    },
  };
});

describe("CertificateGenerator & jsPDF 4.2.1 Integration", () => {
  const defaultProps = {
    studentName: "John Doe",
    courseTitle: "Apparel Quality Management",
    issueDate: "September 13, 2026",
    certificateId: "CERT-9988-ABC",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("initializes and renders the download certificate button", async () => {
    render(<CertificateGenerator {...defaultProps} />);
    const button = screen.getByRole("button", { name: /download pdf/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();

    // Wait for async QR code generation to complete
    await waitFor(() => {
      expect(screen.getByAltText("QC")).toBeInTheDocument();
    });
  });

  it("passes certificate data and verification information into the certificate template", async () => {
    render(<CertificateGenerator {...defaultProps} />);

    // Verify recipient name
    expect(screen.getByText("John Doe")).toBeInTheDocument();

    // Verify course title
    expect(screen.getByText("Apparel Quality Management")).toBeInTheDocument();

    // Verify issue date
    expect(screen.getByText("September 13, 2026")).toBeInTheDocument();

    // Verify Certificate ID and authentic branding
    expect(screen.getByText("ID: CERT-9988-ABC")).toBeInTheDocument();
    expect(screen.getByText(/VERIFIED CERTIFICATE • INDUSTRY MENTOR/i)).toBeInTheDocument();
    expect(screen.getByText("AUTHENTIC")).toBeInTheDocument();

    // Wait for async QR code generation to complete
    await waitFor(() => {
      expect(screen.getByAltText("QC")).toBeInTheDocument();
    });
  });

  it("executes PDF generation workflow with jsPDF without throwing", async () => {
    render(<CertificateGenerator {...defaultProps} />);
    const button = screen.getByRole("button", { name: /download pdf/i });

    // Wait for QR to be ready
    await waitFor(() => {
      expect(screen.getByAltText("QC")).toBeInTheDocument();
    });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    expect(mockSave).toHaveBeenCalledWith("Certificate-Apparel-Quality-Management.pdf");
    expect(mockAddImage).toHaveBeenCalled();
  });

  it("directly verifies real jsPDF 4.2.1 constructor and PDF output generation", async () => {
    const actual = await vi.importActual<typeof import("jspdf")>("jspdf");
    const RealJsPDF = actual.jsPDF || actual.default;

    const doc = new RealJsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Check A4 Landscape dimensions (297mm x 210mm)
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    expect(Math.round(width)).toBe(297);
    expect(Math.round(height)).toBe(210);

    // Add 1x1 image
    const dummyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    doc.addImage(dummyPng, "PNG", 0, 0, width, height);

    // Verify output buffer is non-empty and non-zero
    const buffer = doc.output("arraybuffer");
    expect(buffer).toBeDefined();
    expect(buffer.byteLength).toBeGreaterThan(1000);
  });
});
