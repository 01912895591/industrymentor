import React from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  Clock,
  CreditCard,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

export default function RefundPolicy() {
  const lastUpdated = "September 14, 2026";

  const sections = [
    { id: "overview", title: "1. Policy Overview" },
    { id: "eligibility", title: "2. Eligibility Criteria" },
    { id: "before-access", title: "3. Cancellation Before Course Access" },
    { id: "after-access", title: "4. Cancellation After Course Access" },
    { id: "request-process", title: "5. Refund Request Process" },
    { id: "required-info", title: "6. Required Information" },
    { id: "processing-time", title: "7. Review & Verification Time" },
    { id: "payment-providers", title: "8. Payment Channel Settlement" },
    { id: "non-refundable", title: "9. Non-Refundable Situations" },
    { id: "duplicate-payments", title: "10. Duplicate / Incorrect Payments" },
    { id: "fraudulent", title: "11. Fraudulent & Disputed Transactions" },
    { id: "promotions", title: "12. Promotional & Discounted Purchases" },
    { id: "exceptions", title: "13. Course-Specific Exceptions" },
    { id: "mentorship-cancel", title: "14. Mentorship Cancellation Terms" },
    { id: "policy-changes", title: "15. Changes to Refund Policy" },
    { id: "contact-info", title: "16. Contact Information" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 pt-8 sm:pt-12">
      <SEOHead
        title="Refund & Cancellation Policy — IndustryMentor"
        description="Understand the refund terms, cancellation processes, and fee settlement procedures for IndustryMentor courses and resources."
        canonicalUrl="https://industrymentor.net/refund-policy"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <Badge variant="outline" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
            Payment Terms
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Refund &amp; Cancellation <span className="text-gradient">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Effective Date: {lastUpdated} • Version 1.0
          </p>
        </div>

        {/* Quick Nav Card */}
        <Card className="mb-12 border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-6">
            <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs text-muted-foreground">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="hover:text-primary transition-colors py-1 truncate"
                >
                  {s.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Policy Body */}
        <div className="space-y-12 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section id="overview" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">01.</span> Policy Overview
            </h2>
            <p>
              At <strong>IndustryMentor</strong> (<a href="https://industrymentor.net" className="text-primary hover:underline">https://industrymentor.net</a>), we are committed to delivering high-caliber educational programs, industrial standard operating procedures (SOPs), and mentorship connections. We value transparency and trust in all student financial transactions.
            </p>
            <p className="mt-2">
              This Refund &amp; Cancellation Policy outlines the conditions under which course enrollment fees may be refunded, the administrative verification process, and the non-refundable circumstances associated with digital intellectual property.
            </p>
          </section>

          {/* Section 2 */}
          <section id="eligibility" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">02.</span> Eligibility Criteria
            </h2>
            <p>
              Refund requests are evaluated on a case-by-case basis by IndustryMentor administration according to verified payment records and LMS platform activity. To be considered for a refund:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>The payment must be verified in our records with a matching transaction ID and sender phone number.</li>
              <li>The refund request must be submitted within the platform’s designated review window prior to significant classroom engagement.</li>
              <li>The student must not have breached the platform’s Terms of Service or academic integrity policies.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section id="before-access" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">03.</span> Cancellation Before Course Access
            </h2>
            <p>
              If you submit an enrollment request with payment details and subsequently decide to cancel <em>before</em> your enrollment is approved or before you access the course classroom (<code className="text-primary">/learn/:courseId</code>), you are eligible to request a cancellation.
            </p>
            <p className="mt-2">
              Once your cancellation request is verified against our transaction ledger, your pending enrollment will be cancelled and the fee will be processed for return via the original payment channel.
            </p>
          </section>

          {/* Section 4 */}
          <section id="after-access" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">04.</span> Cancellation After Course Access
            </h2>
            <p>
              IndustryMentor provides proprietary digital intellectual property, technical videos, industrial documentation, and downloadable project materials. 
            </p>
            <p className="mt-2">
              Because digital educational assets are instantly accessible upon classroom entry, refund eligibility is restricted once a student accesses course lessons. If substantial course curriculum has been viewed or course resources have been accessed, fee payments are non-refundable. Legitimate technical access issues reported promptly to support will be resolved or evaluated individually.
            </p>
          </section>

          {/* Section 5 */}
          <section id="request-process" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">05.</span> Refund Request Process
            </h2>
            <p>To initiate a refund or cancellation request, follow these steps:</p>
            <ol className="list-decimal pl-6 mt-2 space-y-1.5">
              <li>Navigate to our official contact portal at <Link to="/contact-us" className="text-primary font-semibold hover:underline">/contact-us</Link>.</li>
              <li>Select or specify "Refund / Payment Cancellation Request" in your inquiry.</li>
              <li>Submit the request using the exact email address associated with your registered IndustryMentor account.</li>
              <li>Provide the mandatory transaction verification information detailed in Section 6.</li>
            </ol>
          </section>

          {/* Section 6 */}
          <section id="required-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">06.</span> Required Information
            </h2>
            <p>To safeguard against unauthorized requests, all refund submissions must include:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Student Full Legal Name:</strong> As registered on the account.</li>
              <li><strong>Account Email &amp; Phone:</strong> Used for account registration.</li>
              <li><strong>Course Title:</strong> The specific course for which cancellation is requested.</li>
              <li><strong>Payment Method:</strong> bKash, Nagad, or Bank Transfer.</li>
              <li><strong>Sender Phone Number / Account:</strong> The account from which funds were transferred.</li>
              <li><strong>Transaction ID (TxID):</strong> The exact alphanumeric code issued by the payment provider.</li>
              <li><strong>Payment Date &amp; Amount:</strong> Approximate time and amount paid in BDT.</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section id="processing-time" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">07.</span> Review &amp; Verification Time
            </h2>
            <p>
              Because course enrollments and payments are manually cross-referenced against receiving accounts, our finance department conducts an audit of the request, transaction ledger, and classroom access logs. 
            </p>
            <p className="mt-2">
              Review and administrative approval typically takes between <strong>3 to 7 business days</strong> from the receipt of complete documentation. You will receive an email confirmation once the review is completed.
            </p>
          </section>

          {/* Section 8 */}
          <section id="payment-providers" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">08.</span> Payment Channel Settlement
            </h2>
            <p>
              Approved refunds are disbursed back to the original funding source (e.g., the original bKash wallet, Nagad account, or sending bank account). 
            </p>
            <p className="mt-2">
              <em>Third-Party Transaction Fees:</em> Mobile Financial Services and commercial banking networks may levy non-refundable transaction or cash-out fees. Where applicable, the refund amount credited will reflect the net recoverable settlement in accordance with financial service rules.
            </p>
          </section>

          {/* Section 9 */}
          <section id="non-refundable" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">09.</span> Non-Refundable Situations
            </h2>
            <p>Refunds will not be granted under the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Course Completion:</strong> If the student has completed course modules or viewed substantial curriculum lessons.</li>
              <li><strong>Certificate Issued:</strong> If an official Certificate of Completion has already been generated or verified.</li>
              <li><strong>Resource Library Downloads:</strong> Digital SOPs, templates, and downloadable calculation tools that have been accessed or downloaded.</li>
              <li><strong>Terms Violation:</strong> If the account has been suspended or terminated due to academic dishonesty, plagiarism, or unauthorized redistribution of course content.</li>
              <li><strong>Inaccurate Payment Claims:</strong> If the submitted transaction ID does not match our bank or MFS account statements.</li>
            </ul>
          </section>

          {/* Section 10 */}
          <section id="duplicate-payments" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">10.</span> Duplicate / Incorrect Payments
            </h2>
            <p>
              In the event that you accidentally execute a duplicate transaction for the same course enrollment, please notify support immediately with both transaction identifiers. Upon verifying that two identical payments were received for a single enrollment, the duplicate fee will be refunded in full without penalty.
            </p>
          </section>

          {/* Section 11 */}
          <section id="fraudulent" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">11.</span> Fraudulent &amp; Disputed Transactions
            </h2>
            <p>
              IndustryMentor strictly monitors transactions for fraudulent submissions. Any attempt to gain unauthorized course access by fabricating transaction IDs, submitting third-party receipts, or filing false disputes will result in immediate account termination, revocation of all earned credentials, and potential reporting to law enforcement authorities.
            </p>
          </section>

          {/* Section 12 */}
          <section id="promotions" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">12.</span> Promotional &amp; Discounted Purchases
            </h2>
            <p>
              Courses or educational packages purchased during limited-time flash sales, promotional discount campaigns, or institutional subsidized programs may be subject to specific non-refundable conditions stated at the time of purchase. Where eligible for refund, promotional purchases are refunded only at the discounted price actually paid.
            </p>
          </section>

          {/* Section 13 */}
          <section id="exceptions" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">13.</span> Course-Specific Exceptions
            </h2>
            <p>
              Certain intensive bootcamps, physical factory workshop cohorts, or customized corporate training batches may involve pre-allocated seating, printed materials, or reserved expert time. Such programs may maintain custom cancellation schedules communicated in the specific course description.
            </p>
          </section>

          {/* Section 14 */}
          <section id="mentorship-cancel" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">14.</span> Mentorship Cancellation Terms
            </h2>
            <p>
              Mentorship interactions initiated via platform inquiries are coordinated directly between the inquirer, the mentor, and platform administrators. If a scheduled paid mentorship session is agreed upon and must be cancelled, requests must be submitted at least 24 hours prior to the session time to allow rescheduling or refund review. Missed sessions without notice are non-refundable.
            </p>
          </section>

          {/* Section 15 */}
          <section id="policy-changes" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">15.</span> Changes to Refund Policy
            </h2>
            <p>
              IndustryMentor reserves the right to amend or update this Refund &amp; Cancellation Policy at any time. Any changes will be posted on this page with an updated "Effective Date". Enrollments are governed by the policy in effect on the date the enrollment was submitted.
            </p>
          </section>

          {/* Section 16 */}
          <section id="contact-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">16.</span> Contact Information
            </h2>
            <p>
              If you have questions regarding payment status, cancellation requests, or fee verification, please contact our finance and support desk through our verified channels:
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Online Inquiries</div>
                    <Link to="/contact-us" className="text-xs text-primary hover:underline mt-1 block">
                      Support Contact Form
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Finance Helpline</div>
                    <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                      +8801912895591
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Office Address</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Legal Disclaimer Box */}
          <div className="mt-16 rounded-xl border border-border/80 bg-muted/30 p-5 text-xs text-muted-foreground text-center">
            <p className="font-medium text-foreground mb-1">Notice of Policy Review</p>
            <p>
              These policies are provided for general informational and operational purposes and should be reviewed by qualified legal counsel before final commercial use.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
