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

// Mock bwip-js barcode generator
vi.mock("bwip-js", () => {
  return {
    default: {
      toSVG: vi.fn().mockReturnValue('<svg viewBox="0 0 185 80"><path d="M0 0"/></svg>')
    },
    toSVG: vi.fn().mockReturnValue('<svg viewBox="0 0 185 80"><path d="M0 0"/></svg>')
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
    studentName: "Jahid Hasan",
    courseTitle: "Garments Merchandising: From Order to Shipment Excellence",
    issueDate: "14 Sept 2026",
    certificateId: "9A0FF246",
    trainingHours: "40 training hours",
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
  });

  it("passes certificate data and verification information into the certificate template", async () => {
    render(<CertificateGenerator {...defaultProps} />);

    // Verify recipient name
    expect(screen.getByText("Jahid Hasan")).toBeInTheDocument();

    // Verify course title
    expect(screen.getByText("Garments Merchandising: From Order to Shipment Excellence")).toBeInTheDocument();

    // Verify issue date
    expect(screen.getByText(/14 Sept 2026/i)).toBeInTheDocument();

    // Verify Certificate ID and serial text
    expect(screen.getAllByText(/9A0FF246/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/IM-9A0FF246-BD/i)).toBeInTheDocument();
    expect(screen.getAllByText(/VERIFIED/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CREDENTIAL/i).length).toBeGreaterThan(0);

    // Verify dual authorized signatures
    expect(screen.getByText("M A Qaiyum Talukder")).toBeInTheDocument();
    expect(screen.getByText(/CEO and Founder/i)).toBeInTheDocument();
    expect(screen.getByText("Engr. Mehedi Hasan")).toBeInTheDocument();
    expect(screen.getByText("COO")).toBeInTheDocument();

    // Verify verification instruction
    expect(screen.getByText(/Scan to verify/i)).toBeInTheDocument();

    // Verify PNG download option is available
    expect(screen.getByRole("button", { name: /png image/i })).toBeInTheDocument();
  });

  it("renders dynamic student name passed from student profile rather than static fallback", () => {
    render(
      <CertificateGenerator
        {...defaultProps}
        studentName="Md. Munna"
      />
    );
    expect(screen.getByText("Md. Munna")).toBeInTheDocument();
    expect(screen.queryByText("Valued Student")).not.toBeInTheDocument();
  });

  it("executes PDF generation workflow with jsPDF without throwing", async () => {
    render(<CertificateGenerator {...defaultProps} />);
    const button = screen.getByRole("button", { name: /download pdf/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    expect(mockSave).toHaveBeenCalledWith("Certificate-Garments-Merchandising--From-Order-to-Shipment-Excellence.pdf");
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
