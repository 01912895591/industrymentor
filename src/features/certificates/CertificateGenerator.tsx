import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import bwipjs from "bwip-js";
import { Button } from "@/components/ui/button";
import { Download, FileImage, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

import { QAIYUM_SIGNATURE_DATA_URL } from "./signatureAsset";

export interface CertificateGeneratorProps {
  studentName: string;
  courseTitle: string;
  issueDate: string;
  certificateId: string;
  trainingHours?: string;
  className?: string;
  showPreview?: boolean;
}

export function CertificateGenerator({
  studentName,
  courseTitle,
  issueDate,
  certificateId,
  trainingHours = "40 training hours",
  className,
}: CertificateGeneratorProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [qrSrc, setQrSrc] = useState<string>("");
  const [barcodeSvgInner, setBarcodeSvgInner] = useState<{ viewBox: string; inner: string }>({
    viewBox: "0 0 185 80",
    inner: "",
  });

  // Clean cryptographic 8-character ID format (e.g. 9A0FF246)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(certificateId);
  const displayCertId = isUuid
    ? certificateId.replace(/-/g, "").slice(0, 8).toUpperCase()
    : certificateId;

  const serialText = `IM-${displayCertId}-BD`;
  const verifyUrl = `https://industrymentor.net/verify/${displayCertId}`;

  // 1. Generate real scannable QR Code
  useEffect(() => {
    QRCode.toDataURL(verifyUrl, {
      width: 160,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then(setQrSrc)
      .catch((err) => console.error("QR Generation failed", err));
  }, [verifyUrl]);

  // 2. Generate real Code128 Barcode via bwip-js
  useEffect(() => {
    try {
      const rawSvg = bwipjs.toSVG({
        bcid: "code128",
        text: displayCertId,
        scaleX: 1.5,
        scaleY: 1,
        height: 26,
        includetext: false,
      });

      const match = rawSvg.match(/viewBox="([^"]+)"/);
      const vb = match ? match[1] : "0 0 185 80";
      const cleanInner = rawSvg.replace(/<\/?svg[^>]*>/g, "");
      setBarcodeSvgInner({ viewBox: vb, inner: cleanInner });
    } catch (e) {
      console.error("Barcode generation error:", e);
    }
  }, [displayCertId]);

  // Capture canvas @ 300 DPI equivalent scale
  const captureCanvas = async () => {
    if (!certificateRef.current) return null;
    return await html2canvas(certificateRef.current, {
      scale: 3, // 300 DPI high-definition
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: "#F8F9F4",
      width: 1000,
      height: 707,
      windowWidth: 1050,
      windowHeight: 750,
    });
  };

  // Export 300 DPI A4 Landscape PDF
  const generatePDF = async () => {
    if (!certificateRef.current) return;
    setGenerating(true);

    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      const safeFilename = `Certificate-${courseTitle.replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      pdf.save(safeFilename);
    } catch (err) {
      console.error("Certificate PDF generation failed", err);
    } finally {
      setGenerating(false);
    }
  };

  // Export High-Res PNG
  const generatePNG = async () => {
    if (!certificateRef.current) return;
    setGenerating(true);

    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const imgData = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = imgData;
      downloadLink.download = `Certificate-${courseTitle.replace(/[^a-zA-Z0-9]/g, "-")}.png`;
      downloadLink.click();
    } catch (err) {
      console.error("Certificate PNG generation failed", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={className || ""}>
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={generatePDF}
          disabled={generating}
          className="h-9 text-xs font-semibold gap-1.5 border-border/70 hover:border-primary/50"
        >
          {generating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <Download className="h-3.5 w-3.5 text-primary" />
          )}
          {generating ? "Generating..." : "Download PDF"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={generatePNG}
          disabled={generating}
          className="h-9 text-xs font-medium gap-1.5 text-muted-foreground hover:text-foreground"
          title="Download 300 DPI PNG Image"
        >
          <FileImage className="h-3.5 w-3.5" />
          PNG Image
        </Button>
      </div>

      {/* Hidden Vector Certificate Engine - Scaled to exact A4 1000 x 707 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "250vw",
          width: "1000px",
          height: "707px",
          overflow: "hidden",
          zIndex: -9999,
        }}
        aria-hidden="true"
      >
        <div
          ref={certificateRef}
          style={{
            width: "1000px",
            height: "707px",
            backgroundColor: "#F8F9F4",
            position: "relative",
            boxSizing: "border-box",
            overflow: "hidden",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1000 707"
            width="1000"
            height="707"
            style={{ display: "block" }}
          >
            <defs>
              {/* Brand Primary Gradient */}
              <linearGradient id="imBrandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F6E56" />
                <stop offset="50%" stopColor="#1D9E75" />
                <stop offset="100%" stopColor="#378ADD" />
              </linearGradient>

              {/* Diagonal Border Gradient */}
              <linearGradient id="imBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0F6E56" />
                <stop offset="45%" stopColor="#1D9E75" />
                <stop offset="100%" stopColor="#378ADD" />
              </linearGradient>

              {/* Holographic Security Strip Gradient */}
              <linearGradient id="imHoloGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#1D9E75" stopOpacity="0.85" />
                <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#A855F7" stopOpacity="0.85" />
                <stop offset="75%" stopColor="#378ADD" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#1D9E75" stopOpacity="0.85" />
              </linearGradient>

              {/* Seal Badge Radial Gradient */}
              <radialGradient id="imSealGrad" cx="40%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#1D9E75" />
                <stop offset="70%" stopColor="#0F6E56" />
                <stop offset="100%" stopColor="#094334" />
              </radialGradient>

              {/* Clip Path for Internal Waves & Microprint so NOTHING crosses borders */}
              <clipPath id="imInnerBorderClip">
                <rect x="22" y="22" width="956" height="663" />
              </clipPath>

              <style>
                {`
                  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                  .im-font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                  .im-font-serif { font-family: 'Georgia', 'Times New Roman', serif; }
                  .im-font-mono { font-family: 'Courier New', Courier, monospace; }
                `}
              </style>
            </defs>

            {/* 1. Background Base #F8F9F4 (Exact W x H, zero outer margin) */}
            <rect x="0" y="0" width="1000" height="707" fill="#F8F9F4" />

            {/* 2. Decorative Guilloche Waves & Watermark (Strictly clipped inside border) */}
            <g clipPath="url(#imInnerBorderClip)">
              <g opacity="0.05" stroke="#0F6E56" fill="none" strokeWidth="0.8">
                <path d="M 0 120 C 250 80, 450 160, 700 100 C 850 70, 950 140, 1000 110" />
                <path d="M 0 140 C 260 100, 440 180, 710 120 C 860 90, 940 160, 1000 130" />
                <path d="M 0 160 C 270 120, 430 200, 720 140 C 870 110, 930 180, 1000 150" />
                <path d="M 0 180 C 280 140, 420 220, 730 160 C 880 130, 920 200, 1000 170" />

                <path d="M 0 540 C 250 580, 480 500, 720 560 C 860 590, 940 520, 1000 550" />
                <path d="M 0 560 C 260 600, 470 520, 710 580 C 850 610, 950 540, 1000 570" />
                <path d="M 0 580 C 270 620, 460 540, 700 600 C 840 630, 960 560, 1000 590" />

                <path d="M 50 0 C 150 250, 100 450, 200 707" />
                <path d="M 70 0 C 170 250, 120 450, 220 707" />
                <path d="M 950 0 C 850 250, 900 450, 800 707" />
                <path d="M 930 0 C 830 250, 880 450, 780 707" />
              </g>

              {/* Flowing Ribbon Lines */}
              <g opacity="0.17" fill="none">
                <path d="M 0 280 C 80 240, 140 180, 160 120 C 180 60, 210 20, 260 0" stroke="#D4AF37" strokeWidth="1.8" />
                <path d="M 0 310 C 90 270, 160 200, 180 140 C 200 80, 230 40, 290 0" stroke="#378ADD" strokeWidth="1.4" />
                <path d="M 0 340 C 100 290, 180 220, 200 160 C 220 100, 250 50, 320 0" stroke="#E8C766" strokeWidth="1" />
                <path d="M 40 370 C 120 310, 190 240, 215 180 C 240 120, 270 60, 350 0" stroke="#1D9E75" strokeWidth="0.8" />
              </g>

              <g opacity="0.17" fill="none">
                <path d="M 740 707 C 790 640, 820 600, 840 540 C 860 480, 920 440, 1000 400" stroke="#D4AF37" strokeWidth="1.8" />
                <path d="M 710 707 C 760 650, 800 590, 820 530 C 840 470, 900 420, 1000 370" stroke="#378ADD" strokeWidth="1.4" />
                <path d="M 680 707 C 730 660, 780 580, 800 520 C 820 460, 880 400, 1000 340" stroke="#E8C766" strokeWidth="1" />
              </g>

              {/* Center Background Watermark: Large faded "iM" mark */}
              <g transform="translate(500, 343)" opacity="0.04" fill="none" stroke="#0F6E56">
                <circle cx="0" cy="0" r="175" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="160" strokeWidth="1" strokeDasharray="6 4" />
                <text
                  x="0"
                  y="65"
                  textAnchor="middle"
                  fontFamily="'Georgia', serif"
                  fontSize="210"
                  fontWeight="700"
                  fill="#0F6E56"
                  stroke="none"
                >
                  iM
                </text>
              </g>
            </g>

            {/* 3. Triple-Layer Border System */}
            <rect x="18" y="18" width="964" height="671" fill="none" stroke="url(#imBorderGrad)" strokeWidth="4" />
            <rect x="25" y="25" width="950" height="657" fill="none" stroke="#0C243E" strokeWidth="1" />
            <rect x="30" y="30" width="940" height="647" fill="none" stroke="#378ADD" strokeWidth="0.5" />

            {/* 4. Four Corner Triangle Accents anchored directly to canvas corners */}
            {/* Top-Left Corner */}
            <polygon points="0,0 60,0 0,60" fill="#0C243E" />
            <polygon points="0,0 42,0 0,42" fill="#1D9E75" />

            {/* Top-Right Corner */}
            <polygon points="1000,0 940,0 1000,60" fill="#0C243E" />
            <polygon points="1000,0 958,0 1000,42" fill="#378ADD" />

            {/* Bottom-Left Corner */}
            <polygon points="0,707 75,707 0,632" fill="#0F6E56" />
            <polygon points="0,707 50,707 0,657" fill="#0C243E" />

            {/* Bottom-Right Corner */}
            <polygon points="1000,707 925,707 1000,632" fill="#0F6E56" />
            <polygon points="1000,707 950,707 1000,657" fill="#378ADD" />

            {/* 5. Top Microprint Text strictly contained and centered */}
            <g clipPath="url(#imInnerBorderClip)">
              <text
                x="500"
                y="43"
                textAnchor="middle"
                className="im-font-mono"
                fontSize="6.5"
                fill="#5F5E5A"
                opacity="0.32"
                letterSpacing="2.5"
              >
                INDUSTRYMENTOR • VERIFIED CREDENTIAL • INDUSTRYMENTOR • VERIFIED CREDENTIAL • INDUSTRYMENTOR • VERIFIED CREDENTIAL
              </text>
            </g>

            {/* 6. Top-Left Brand Logo: "iM industrymentor" */}
            <g transform="translate(68, 65)">
              <circle cx="18" cy="18" r="18" fill="#0F6E56" />
              <text x="18" y="24" textAnchor="middle" className="im-font-sans" fontSize="17" fontWeight="700" fill="#FFFFFF">
                iM
              </text>
              <text x="46" y="24" className="im-font-sans" fontSize="20" fill="#0C243E">
                <tspan fontWeight="400">industry</tspan>
                <tspan fontWeight="700" fill="#0F6E56">
                  mentor
                </tspan>
              </text>
            </g>

            {/* 7. Top-Right Embossed Circular Seal Badge with Ribbon Tails */}
            <g transform="translate(895, 90)">
              <path d="M -15 32 L -15 60 L -7 53 L 0 60 L 0 32 Z" fill="#094334" />
              <path d="M 0 32 L 0 60 L 7 53 L 15 60 L 15 32 Z" fill="#0F6E56" />

              <circle cx="0" cy="0" r="45" fill="none" stroke="#D4AF37" strokeWidth="1" opacity="0.7" />
              <circle cx="0" cy="0" r="43" fill="url(#imSealGrad)" />
              <circle cx="0" cy="0" r="39" fill="none" stroke="#FFFFFF" strokeWidth="0.8" opacity="0.85" />
              <circle cx="0" cy="0" r="36" fill="none" stroke="#FFFFFF" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.8" />
              <circle cx="0" cy="0" r="33" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6" />

              <text x="0" y="-3" textAnchor="middle" className="im-font-sans" fontSize="9" fontWeight="700" fill="#FFFFFF" letterSpacing="1">
                VERIFIED
              </text>
              <text x="0" y="10" textAnchor="middle" className="im-font-sans" fontSize="8" fontWeight="600" fill="#E2E8F0" letterSpacing="1.2">
                CREDENTIAL
              </text>
            </g>

            {/* 8. Heading: CERTIFICATE OF ACHIEVEMENT */}
            <g transform="translate(500, 195)">
              <text x="0" y="0" textAnchor="middle" className="im-font-sans" fontSize="20" fontWeight="600" fill="#0F6E56" letterSpacing="6">
                CERTIFICATE OF ACHIEVEMENT
              </text>

              <g transform="translate(0, 24)">
                <circle cx="-140" cy="0" r="3.5" fill="#1D9E75" />
                <line x1="-132" y1="0" x2="132" y2="0" stroke="#CBD5E1" strokeWidth="0.8" />
                <circle cx="140" cy="0" r="3.5" fill="#378ADD" />
              </g>
            </g>

            {/* 9. "This is proudly presented to" */}
            <text x="500" y="255" textAnchor="middle" className="im-font-sans" fontSize="13.5" fontWeight="400" fill="#5F5E5A">
              This is proudly presented to
            </text>

            {/* 10. Recipient Name + Curved Blue Underline */}
            <g transform="translate(500, 320)">
              <text x="0" y="0" textAnchor="middle" className="im-font-serif" fontSize="42" fontWeight="700" fill="#0C243E" letterSpacing="0.5">
                {studentName}
              </text>
              <path d="M -150 16 Q 0 24 150 16" fill="none" stroke="#378ADD" strokeWidth="1.6" strokeLinecap="round" />
            </g>

            {/* 11. "for successfully completing the professional course" */}
            <text x="500" y="380" textAnchor="middle" className="im-font-sans" fontSize="13.5" fontWeight="400" fill="#5F5E5A">
              for successfully completing the professional course
            </text>

            {/* 12. Course Name (Bold Teal) */}
            <g transform="translate(500, 422)">
              <text x="0" y="0" textAnchor="middle" className="im-font-sans" fontSize="20" fontWeight="700" fill="#0F6E56">
                {courseTitle}
              </text>
            </g>

            {/* 13. Meta Line: Issued Date • Certificate ID • Training Hours */}
            <g transform="translate(500, 462)">
              <text x="0" y="0" textAnchor="middle" className="im-font-sans" fontSize="12.5" fontWeight="500" fill="#5F5E5A">
                Issued {issueDate} <tspan fill="#CBD5E1" fontWeight="700"> • </tspan> Certificate ID{" "}
                <tspan fontFamily="'Courier New', monospace" fontWeight="600" fill="#0C243E">
                  {displayCertId}
                </tspan>{" "}
                <tspan fill="#CBD5E1" fontWeight="700"> • </tspan> {trainingHours}
              </text>
              <text x="0" y="0" style={{ display: "none" }}>ID: {certificateId}</text>
            </g>

            {/* 14. Holographic-Style Security Strip */}
            <g transform="translate(500, 496)">
              <rect x="-100" y="0" width="200" height="9" rx="2" fill="url(#imHoloGrad)" />
              <text x="0" y="21" textAnchor="middle" className="im-font-sans" fontSize="8" fontWeight="600" fill="#888780" letterSpacing="1.5">
                TAMPER-EVIDENT SECURITY STRIP
              </text>
            </g>

            {/* 15. Bottom Row: Real Barcode (Left), Signatures + Real QR (Center & Right) */}
            <g transform="translate(0, 595)">
              {/* Bottom-Left: Real Code128 Barcode + Monospace Serial (46px clearance from bottom border) */}
              <g transform="translate(62, -10)">
                {barcodeSvgInner.inner && (
                  <svg
                    x="0"
                    y="0"
                    width="120"
                    height="34"
                    viewBox={barcodeSvgInner.viewBox}
                    dangerouslySetInnerHTML={{ __html: barcodeSvgInner.inner }}
                  />
                )}
                <text x="60" y="46" textAnchor="middle" className="im-font-mono" fontSize="9.5" fill="#5F5E5A" letterSpacing="0.5">
                  {serialText}
                </text>
              </g>

              {/* Left Signature: M A Qaiyum Talukder / CEO and Founder */}
              <g transform="translate(270, 10)">
                {/* CEO Signature Image - positioned directly above underline */}
                <image
                  href={QAIYUM_SIGNATURE_DATA_URL}
                  xlinkHref={QAIYUM_SIGNATURE_DATA_URL}
                  x="-75"
                  y="-52"
                  width="150"
                  height="52"
                  preserveAspectRatio="xMidYMid meet"
                />
                <line x1="-80" y1="0" x2="80" y2="0" stroke="#94A3B8" strokeWidth="0.9" />
                <text x="0" y="16" textAnchor="middle" className="im-font-sans" fontSize="13" fontWeight="600" fill="#0C243E">
                  M A Qaiyum Talukder
                </text>
                <text x="0" y="30" textAnchor="middle" className="im-font-sans" fontSize="11" fontWeight="400" fill="#5F5E5A">
                  CEO and Founder
                </text>
              </g>

              {/* Center: Real Scannable QR Code + "Scan to verify" */}
              <g transform="translate(495, -45)">
                <rect x="-27" y="-2" width="54" height="54" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" rx="2" />
                {qrSrc && <image href={qrSrc} x="-25" y="0" width="50" height="50" />}
                <text x="0" y="66" textAnchor="middle" className="im-font-sans" fontSize="10" fontWeight="500" fill="#5F5E5A">
                  Scan to verify
                </text>
              </g>

              {/* Right Signature: Engr. Mehedi Hasan / COO */}
              <g transform="translate(720, 10)">
                <line x1="-80" y1="0" x2="80" y2="0" stroke="#94A3B8" strokeWidth="0.9" />
                <text x="0" y="16" textAnchor="middle" className="im-font-sans" fontSize="13" fontWeight="600" fill="#0C243E">
                  Engr. Mehedi Hasan
                </text>
                <text x="0" y="30" textAnchor="middle" className="im-font-sans" fontSize="11" fontWeight="400" fill="#5F5E5A">
                  COO
                </text>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
