import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import RefundPolicy from "@/pages/RefundPolicy";

function renderWithRouter(ui: React.ReactElement) {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
}

describe("Legal & Policy Pages", () => {
  beforeEach(() => {
    document.title = "Default Title";
    document.querySelectorAll('meta[name="description"]').forEach((el) => el.remove());
    document.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());
  });

  afterEach(() => {
    cleanup();
  });

  describe("Privacy Policy Page", () => {
    it("renders Privacy Policy heading, key sections, and legal disclaimer", () => {
      renderWithRouter(<PrivacyPolicy />);

      // Check Heading
      expect(screen.getByRole("heading", { name: /Privacy Policy/i, level: 1 })).toBeInTheDocument();

      // Check Key Sections
      expect(screen.getByText(/1\. Introduction/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. Account Information/i)).toBeInTheDocument();
      expect(screen.getByText(/10\. Payment & Transaction Information/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Public Portfolio Data vs/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/18\. Data Security Measures/i)).toBeInTheDocument();
      expect(screen.getByText(/24\. Cookies & Browser Storage/i)).toBeInTheDocument();

      // Check Contact Info
      expect(screen.getByText(/25\/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh/i)).toBeInTheDocument();
      expect(screen.getByText(/\+8801912895591/i)).toBeInTheDocument();

      // Check Mandatory Legal Disclaimer Notice
      expect(screen.getByText(/Notice of Policy Review/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /These policies are provided for general informational and operational purposes and should be reviewed by qualified legal counsel before final commercial use\./i
        )
      ).toBeInTheDocument();
    });
  });

  describe("Terms of Service Page", () => {
    it("renders Terms of Service heading, No Employment Guarantee, and key clauses", () => {
      renderWithRouter(<TermsOfService />);

      // Check Heading
      expect(screen.getByRole("heading", { name: /Terms of Service/i, level: 1 })).toBeInTheDocument();

      // Check Critical "No Employment Guarantee" Clause
      expect(screen.getByText(/20\. No Employment Guarantee/i)).toBeInTheDocument();
      expect(
        screen.getByText(/IndustryMentor provides educational and professional skill development resources/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Employment or job placement at any garment manufacturing factory/i)
      ).toBeInTheDocument();

      // Check Other Key Sections
      expect(screen.getByText(/6\. Course Access/i)).toBeInTheDocument();
      expect(screen.getByText(/8\. Mentorship Inquiries/i)).toBeInTheDocument();
      expect(screen.getByText(/9\. Projects & Submissions/i)).toBeInTheDocument();
      expect(screen.getByText(/11\. Certificates of Completion/i)).toBeInTheDocument();
      expect(screen.getByText(/12\. Certificate Verification/i)).toBeInTheDocument();

      // Check Mandatory Legal Disclaimer Notice
      expect(
        screen.getByText(
          /These policies are provided for general informational and operational purposes and should be reviewed by qualified legal counsel before final commercial use\./i
        )
      ).toBeInTheDocument();
    });
  });

  describe("Refund & Cancellation Policy Page", () => {
    it("renders Refund Policy heading, request workflow, and non-refundable cases", () => {
      renderWithRouter(<RefundPolicy />);

      // Check Heading
      expect(
        screen.getByRole("heading", { name: /Refund & Cancellation Policy/i, level: 1 })
      ).toBeInTheDocument();

      // Check Key Sections
      expect(screen.getByText(/1\. Policy Overview/i)).toBeInTheDocument();
      expect(screen.getByText(/3\. Cancellation Before Course Access/i)).toBeInTheDocument();
      expect(screen.getByText(/4\. Cancellation After Course Access/i)).toBeInTheDocument();
      expect(screen.getByText(/5\. Refund Request Process/i)).toBeInTheDocument();
      expect(screen.getByText(/6\. Required Information/i)).toBeInTheDocument();
      expect(screen.getByText(/9\. Non-Refundable Situations/i)).toBeInTheDocument();

      // Check Mandatory Legal Disclaimer Notice
      expect(
        screen.getByText(
          /These policies are provided for general informational and operational purposes and should be reviewed by qualified legal counsel before final commercial use\./i
        )
      ).toBeInTheDocument();
    });
  });
});
