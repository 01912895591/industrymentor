import { useState } from "react";
import { SEOHead } from "@/components/seo/SEOHead";
import { CertificateGenerator } from "@/features/certificates/CertificateGenerator";
import { CertificateVector } from "@/features/certificates/CertificateVector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ExternalLink, ArrowLeft, RefreshCw, Eye, Download, FileText } from "lucide-react";
import { Link } from "react-router-dom";

export default function CertificatePreview() {
  const [studentName, setStudentName] = useState("Jahid Hasan");
  const [courseTitle, setCourseTitle] = useState("Garments Merchandising: From Order to Shipment Excellence");
  const [issueDate, setIssueDate] = useState("14 Sept 2026");
  const [certificateId, setCertificateId] = useState("9A0FF246");
  const [trainingHours, setTrainingHours] = useState("40 training hours");

  const handleResetDefaults = () => {
    setStudentName("Jahid Hasan");
    setCourseTitle("Garments Merchandising: From Order to Shipment Excellence");
    setIssueDate("14 Sept 2026");
    setCertificateId("9A0FF246");
    setTrainingHours("40 training hours");
  };

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Official Certificate Generator & Verification | IndustryMentor"
        description="Official IndustryMentor Certificate Generator with real QR code, Code128 barcode, and 300 DPI A4 landscape export."
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-2">
              <Eye className="h-3.5 w-3.5" /> Official Certificate Generator &amp; Preview
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              Certificate of Achievement Preview
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              A4 Landscape (297mm x 210mm) • Real Code128 Barcode • Real Scannable QR • 300 DPI Print Export.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <a href="/IndustryMentor-Certificate-Sample.pdf" download="IndustryMentor-Certificate-Sample.pdf">
              <Button variant="default" size="sm" className="text-xs font-semibold gap-1.5 bg-gradient-to-r from-[#0F6E56] via-[#1D9E75] to-[#378ADD] text-white">
                <Download className="h-3.5 w-3.5" /> Download Sample PDF
              </Button>
            </a>

            <Link to={`/verify/${certificateId}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 border-border/70">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Test Verify Page <ExternalLink className="h-3 w-3" />
              </Button>
            </Link>

            <Link to="/">
              <Button variant="ghost" size="sm" className="text-xs font-medium gap-1.5 text-muted-foreground">
                <ArrowLeft className="h-3.5 w-3.5" /> Back Home
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-5 rounded-2xl bg-card border border-border/60 shadow-sm">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Student Name</Label>
            <Input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="h-9 text-xs"
              placeholder="e.g. Jahid Hasan"
            />
          </div>

          <div className="space-y-1.5 lg:col-span-2">
            <Label className="text-xs font-semibold">Course Title</Label>
            <Input
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              className="h-9 text-xs"
              placeholder="e.g. Garments Merchandising: From Order to Shipment Excellence"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Training Hours</Label>
            <Input
              value={trainingHours}
              onChange={(e) => setTrainingHours(e.target.value)}
              className="h-9 text-xs"
              placeholder="e.g. 40 training hours"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Certificate ID</Label>
            <div className="flex gap-2">
              <Input
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                className="h-9 text-xs font-mono uppercase"
                placeholder="e.g. 9A0FF246"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetDefaults}
                title="Reset to sample values"
                className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Export Actions & Direct Download Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-card/60 border border-border/50">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span>Generate dynamic print-ready <strong>300 DPI A4 Landscape PDF</strong> or <strong>PNG</strong>:</span>
          </div>
          <CertificateGenerator
            studentName={studentName}
            courseTitle={courseTitle}
            issueDate={issueDate}
            certificateId={certificateId}
            trainingHours={trainingHours}
          />
        </div>

        {/* Visual Certificate Frame */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span className="font-semibold text-foreground">Visual Certificate Preview (A4 Landscape Scale • 297mm x 210mm)</span>
            <span>Ratio 1.414:1 • CMYK Print Ready</span>
          </div>

          <div className="rounded-2xl border border-border/80 shadow-2xl overflow-hidden bg-slate-900/40 p-4 sm:p-8 flex justify-center items-center">
            <div className="w-full max-w-5xl rounded-lg overflow-hidden shadow-2xl border border-border/40 bg-[#F8F9F4]">
              <CertificateVector
                studentName={studentName}
                courseTitle={courseTitle}
                issueDate={issueDate}
                certificateId={certificateId}
                trainingHours={trainingHours}
                idPrefix="live-"
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>

        {/* Verification Link Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0F6E56]/10 via-[#1D9E75]/10 to-[#378ADD]/10 border border-[#1D9E75]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#1D9E75]" />
              Official Online Verification Endpoint
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              https://industrymentor.net/verify/{certificateId}
            </p>
          </div>
          <Link to={`/verify/${certificateId}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="h-9 text-xs font-semibold gap-1.5 bg-gradient-to-r from-[#0F6E56] via-[#1D9E75] to-[#378ADD] text-white">
              Open Live Verification <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
