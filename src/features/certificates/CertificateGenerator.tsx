import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface CertificateGeneratorProps {
    studentName: string;
    courseTitle: string;
    issueDate: string;
    certificateId: string;
    className?: string;
}

export function CertificateGenerator({
    studentName,
    courseTitle,
    issueDate,
    certificateId,
    className
}: CertificateGeneratorProps) {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);

    const generatePDF = async () => {
        if (!certificateRef.current) return;
        setGenerating(true);

        try {
            // 1. Generate QR Code Data URL
            const verifyUrl = `${window.location.origin}/verify/${certificateId}`;
            const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl, { width: 100, margin: 1 });

            // 2. Inject QR into DOM temporarily or ensure it's rendered
            // We will render it in the hidden template below

            // 3. Capture DOM
            const canvas = await html2canvas(certificateRef.current, {
                scale: 4, // Ultra HD
                useCORS: true,
                allowTaint: true,
                logging: false,
                backgroundColor: "#ffffff",
                width: 1123,
                height: 794,
                windowWidth: 1200,
            });

            // 4. Generate PDF
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "landscape",
                unit: "mm",
                format: "a4"
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Certificate-${courseTitle.replace(/\s+/g, "-")}.pdf`);

        } catch (err) {
            console.error("Certificate generation failed", err);
        } finally {
            setGenerating(false);
        }
    };

    // Verification URL for QR
    const verifyUrl = `${window.location.origin}/verify/${certificateId}`;

    // Create a ref for the QR Code image to be populated
    const [qrSrc, setQrSrc] = useState<string>("");

    // Effect to generate QR on mount
    useEffect(() => {
        QRCode.toDataURL(verifyUrl, { width: 120, margin: 0 })
            .then(setQrSrc)
            .catch(err => console.error("QR Generation failed", err));
    }, [verifyUrl]);

    return (
        <div className={className}>
            <Button variant="outline" size="sm" onClick={generatePDF} disabled={generating}>
                {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {generating ? "Generating..." : "Download PDF"}
            </Button>

            {/* Hidden Certificate Template - Fixed Position to ensure visibility for html2canvas */}
            <div style={{ position: "fixed", top: 0, left: "200vw", width: "1123px", height: "794px", overflow: "hidden" }}>
                {/* Font Injection */}
                <style>
                    {`
                        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Lato:wght@300;400&display=swap');
                    `}
                </style>
                <div
                    ref={certificateRef}
                    style={{
                        width: "1123px",
                        height: "794px",
                        padding: "40px",
                        background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 25%, #fed7aa 50%, #ffedd5 75%, #fff7ed 100%)",
                        backgroundImage: "radial-gradient(circle at 20% 30%, rgba(251, 146, 60, 0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(249, 115, 22, 0.06) 0%, transparent 50%), repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(234, 88, 12, 0.02) 50px, rgba(234, 88, 12, 0.02) 51px), repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(234, 88, 12, 0.02) 50px, rgba(234, 88, 12, 0.02) 51px)",
                        fontFamily: "'Cinzel', serif",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        position: "relative",
                        color: "#1e293b",
                        boxSizing: "border-box"
                    }}
                >
                    {/* Security Watermark Background */}
                    <div style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%) rotate(-45deg)",
                        fontSize: "120px",
                        fontWeight: "900",
                        color: "rgba(180, 83, 9, 0.03)",
                        fontFamily: "'Cinzel', serif",
                        letterSpacing: "20px",
                        pointerEvents: "none",
                        userSelect: "none",
                        zIndex: 1
                    }}>
                        AUTHENTIC
                    </div>

                    {/* Security Thread Pattern (Diagonal Lines) */}
                    <div style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: "repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(180, 83, 9, 0.02) 80px, rgba(180, 83, 9, 0.02) 82px)",
                        pointerEvents: "none",
                        zIndex: 1
                    }} />

                    {/* Ornate Border */}
                    <div style={{
                        position: "absolute",
                        top: "20px", left: "20px", right: "20px", bottom: "20px",
                        border: "2px solid #b45309", // Dark Gold
                        pointerEvents: "none",
                        zIndex: 2
                    }}>
                        <div style={{
                            position: "absolute",
                            top: "4px", left: "4px", right: "4px", bottom: "4px",
                            border: "1px solid #1e293b", // Dark Blue
                        }} />
                        {/* Corner Flourishes (CSS Shapes) */}
                        <div style={{ position: "absolute", top: "-5px", left: "-5px", width: "40px", height: "40px", borderTop: "4px solid #b45309", borderLeft: "4px solid #b45309" }} />
                        <div style={{ position: "absolute", top: "-5px", right: "-5px", width: "40px", height: "40px", borderTop: "4px solid #b45309", borderRight: "4px solid #b45309" }} />
                        <div style={{ position: "absolute", bottom: "-5px", left: "-5px", width: "40px", height: "40px", borderBottom: "4px solid #b45309", borderLeft: "4px solid #b45309" }} />
                        <div style={{ position: "absolute", bottom: "-5px", right: "-5px", width: "40px", height: "40px", borderBottom: "4px solid #b45309", borderRight: "4px solid #b45309" }} />
                    </div>

                    {/* Company Logo - Top Left */}
                    <div style={{
                        position: "absolute",
                        top: "40px",
                        left: "60px",
                        width: "110px",
                        height: "110px",
                        zIndex: 10
                    }}>
                        <div style={{
                            width: "100%",
                            height: "100%",
                            background: "#fff",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "8px",
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                            border: "2px solid rgba(180, 83, 9, 0.2)"
                        }}>
                            <img src="/logo.png" alt="IndustryMentor" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                        </div>
                    </div>

                    {/* Gold Seal Badge - Top Right */}
                    <div style={{
                        position: "absolute",
                        top: "30px",
                        right: "50px",
                        zIndex: 10
                    }}>
                        <img
                            src="/badge.png"
                            alt="Certified Professional Badge"
                            style={{
                                width: "120px",
                                height: "120px",
                                filter: "drop-shadow(0 8px 16px rgba(0, 0, 0, 0.2))"
                            }}
                        />
                    </div>

                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: "40px", zIndex: 10 }}>
                        <div style={{
                            fontSize: "14px",
                            textTransform: "uppercase",
                            letterSpacing: "4px",
                            color: "#b45309",
                            marginBottom: "10px",
                            fontFamily: "'Lato', sans-serif"
                        }}>
                            Certificate of Achievement
                        </div>
                        <h1 style={{
                            fontSize: "64px",
                            margin: "0",
                            color: "#1e293b",
                            textTransform: "uppercase",
                            letterSpacing: "8px",
                            fontWeight: "700",
                            textShadow: "1px 1px 0px rgba(0,0,0,0.1)"
                        }}>
                            Certificate
                        </h1>
                        <h2 style={{
                            fontSize: "24px",
                            margin: "5px 0 0",
                            color: "#64748b",
                            fontWeight: "400",
                            fontFamily: "'Lato', sans-serif",
                            letterSpacing: "2px"
                        }}>
                            of Completion
                        </h2>
                    </div>

                    {/* Recipient */}
                    <div style={{ textAlign: "center", marginBottom: "50px", zIndex: 10, width: "80%" }}>
                        <p style={{ fontSize: "18px", margin: "0 0 10px 0", color: "#64748b", fontFamily: "'Lato', sans-serif", fontStyle: "italic" }}>
                            This certifies that
                        </p>
                        <h3 style={{
                            fontSize: "72px",
                            margin: "10px 0",
                            color: "#b45309", // Gold/Bronze
                            fontFamily: "'Great Vibes', cursive",
                            textShadow: "1px 1px 0px rgba(0,0,0,0.1)",
                            padding: "0 20px"
                        }}>
                            {studentName}
                        </h3>
                        <div style={{ width: "60%", height: "1px", background: "linear-gradient(90deg, transparent, #cbd5e1, transparent)", margin: "20px auto" }} />
                        <p style={{ fontSize: "18px", margin: "0", color: "#64748b", fontFamily: "'Lato', sans-serif" }}>
                            has successfully completed the course requirements for
                        </p>
                    </div>

                    {/* Course Title */}
                    <div style={{ textAlign: "center", marginBottom: "60px", zIndex: 10, maxWidth: "800px" }}>
                        <h4 style={{
                            fontSize: "42px",
                            margin: "0",
                            color: "#1e293b",
                            fontWeight: "700",
                            lineHeight: "1.2"
                        }}>
                            {courseTitle}
                        </h4>
                    </div>

                    {/* Footer */}
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        padding: "0 100px",
                        marginTop: "auto",
                        marginBottom: "60px",
                        alignItems: "flex-end",
                        zIndex: 10
                    }}>

                        {/* Date */}
                        <div style={{ textAlign: "center" }}>
                            <p style={{ margin: "0 0 5px 0", fontSize: "20px", borderBottom: "1px solid #94a3b8", paddingBottom: "5px", width: "180px", color: "#334155", fontFamily: "'Lato', sans-serif" }}>
                                {issueDate}
                            </p>
                            <p style={{ margin: "0", fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Lato', sans-serif" }}>Date Issued</p>
                        </div>

                        {/* Gold Seal / QR */}
                        <div style={{ textAlign: "center", position: "relative", top: "10px" }}>
                            {/* Faux Gold Seal visual using CSS radial gradients */}
                            <div style={{
                                width: "130px", height: "130px",
                                background: "linear-gradient(135deg, #fcd34d 0%, #b45309 100%)",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                padding: "4px"
                            }}>
                                <div style={{
                                    width: "100%", height: "100%",
                                    background: "#fff",
                                    borderRadius: "50%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}>
                                    {qrSrc && <img src={qrSrc} alt="QC" style={{ width: "95px", height: "95px" }} />}
                                </div>
                            </div>
                            <p style={{ fontSize: "9px", color: "#94a3b8", marginTop: "10px", fontFamily: "'Lato', sans-serif" }}>ID: {certificateId}</p>
                        </div>

                        {/* Signature */}
                        <div style={{ textAlign: "center" }}>
                            <div style={{ width: "180px", height: "50px", display: "flex", alignItems: "flex-end", justifyContent: "center", marginBottom: "5px" }}>
                                <p style={{ fontFamily: "'Great Vibes', cursive", fontSize: "32px", margin: 0, color: "#1e293b" }}>IndustryMentor</p>
                            </div>
                            <div style={{ borderTop: "1px solid #94a3b8", width: "180px", margin: "0 auto" }} />
                            <p style={{ margin: "5px 0 0 0", fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontFamily: "'Lato', sans-serif" }}>Authorized Signature</p>
                        </div>
                    </div>

                    {/* Bottom Branding */}
                    <div style={{ position: "absolute", bottom: "25px", fontSize: "10px", color: "#cbd5e1", fontFamily: "'Lato', sans-serif", letterSpacing: "1px", zIndex: 10 }}>
                        VERIFIED CERTIFICATE • INDUSTRY MENTOR
                    </div>

                </div>
            </div>
        </div>
    );
}
