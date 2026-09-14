import React from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Server,
  Database,
  ExternalLink,
  HelpCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPolicy() {
  const lastUpdated = "September 14, 2026";

  const sections = [
    { id: "intro", title: "1. Introduction" },
    { id: "scope", title: "2. Scope of Policy" },
    { id: "info-collect", title: "3. Information We Collect" },
    { id: "info-provided", title: "4. Information Provided by Users" },
    { id: "account-info", title: "5. Account Information" },
    { id: "enrollment-info", title: "6. Course & Enrollment Information" },
    { id: "mentorship-info", title: "7. Mentorship Inquiry Information" },
    { id: "project-info", title: "8. Project & Portfolio Information" },
    { id: "certificate-info", title: "9. Certificate Information" },
    { id: "payment-info", title: "10. Payment & Transaction Information" },
    { id: "technical-info", title: "11. Technical Information & Storage" },
    { id: "how-we-use", title: "12. How We Use Information" },
    { id: "how-we-share", title: "13. How We Share Information" },
    { id: "service-providers", title: "14. Service Providers & Infrastructure" },
    { id: "supabase-cloud", title: "15. Cloud Infrastructure & Database" },
    { id: "public-portfolio", title: "16. Public Portfolio Data vs Private Data" },
    { id: "cert-verification", title: "17. Certificate Verification Information" },
    { id: "data-security", title: "18. Data Security Measures" },
    { id: "data-retention", title: "19. Data Retention Policy" },
    { id: "user-rights", title: "20. User Rights & Data Control" },
    { id: "data-requests", title: "21. Account & Data Requests" },
    { id: "children-privacy", title: "22. Children's Privacy" },
    { id: "external-links", title: "23. External Links & Third Parties" },
    { id: "cookies-storage", title: "24. Cookies & Browser Storage" },
    { id: "policy-updates", title: "25. Changes to This Privacy Policy" },
    { id: "contact-info", title: "26. Contact Information" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 pt-8 sm:pt-12">
      <SEOHead
        title="Privacy Policy — IndustryMentor"
        description="Learn how IndustryMentor collects, manages, and protects your personal data, course enrollment records, and student portfolio information."
        canonicalUrl="https://industrymentor.net/privacy-policy"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <Badge variant="outline" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
            Official Policy
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Privacy <span className="text-gradient">Policy</span>
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
          <section id="intro" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">01.</span> Introduction
            </h2>
            <p>
              Welcome to <strong>IndustryMentor</strong> (<a href="https://industrymentor.net" className="text-primary hover:underline">https://industrymentor.net</a>). IndustryMentor is an educational platform dedicated to advancing professional skills in the apparel, textile, and industrial manufacturing sectors through practitioner-led coursework, technical SOPs, mentorship inquiries, practical capstone projects, and verified credentials.
            </p>
            <p className="mt-2">
              We respect your privacy and are committed to safeguarding the personal information you share with us. This Privacy Policy outlines the categories of data we collect, the specific operational purposes for which that data is used, how data is protected, and the controls you maintain over your personal information.
            </p>
          </section>

          {/* Section 2 */}
          <section id="scope" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">02.</span> Scope of Policy
            </h2>
            <p>
              This Privacy Policy applies to all visitors, registered students, mentorship inquirers, and authorized platform administrators accessing our website, web applications, learning management systems (LMS), and related services operated by IndustryMentor. It does not apply to third-party services, independent mentor communication conducted outside our systems, or external websites linked across our platform.
            </p>
          </section>

          {/* Section 3 */}
          <section id="info-collect" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">03.</span> Information We Collect
            </h2>
            <p>
              We collect information strictly necessary to provide authentic educational services, process course enrollments, deliver technical resources, review project assignments, issue verified credentials, and maintain platform security. We do not gather personal information beyond what is directly required for these operational purposes.
            </p>
          </section>

          {/* Section 4 */}
          <section id="info-provided" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">04.</span> Information Provided by Users
            </h2>
            <p>
              Information is submitted directly by you when you create an account, enroll in a course, submit a contact inquiry, reach out to an industry mentor, upload a project assignment, or publish a public professional portfolio.
            </p>
          </section>

          {/* Section 5 */}
          <section id="account-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">05.</span> Account Information
            </h2>
            <p>
              When registering for an IndustryMentor student or user account, we collect:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Full Name:</strong> To personalize your account, verify enrollment, and print official certificates of completion.</li>
              <li><strong>Email Address:</strong> Used as your primary account identifier, for transactional receipts, password reset links, and critical platform notifications.</li>
              <li><strong>Phone Number:</strong> Used as an alternative account identifier, for enrollment communication, and transaction verification.</li>
              <li><strong>Password:</strong> Securely hashed and stored using industry-standard cryptographic algorithms by our authentication infrastructure. IndustryMentor never has access to your raw, plaintext password.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section id="enrollment-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">06.</span> Course &amp; Enrollment Information
            </h2>
            <p>
              When you enroll in a course, our database records your student user ID, target course ID, enrollment date, progression status (pending verification, active enrollment, or completed), and progress milestones within our classroom learning management system.
            </p>
          </section>

          {/* Section 7 */}
          <section id="mentorship-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">07.</span> Mentorship Inquiry Information
            </h2>
            <p>
              When you initiate an inquiry to connect with an industry mentor through our platform, we collect your name, email address, contact phone number, selected technical topic, and your inquiry message. This information is recorded in our administration system to facilitate communication between you and the designated mentor. Mentorship inquiries do not constitute automated live bookings and are processed via dedicated review.
            </p>
          </section>

          {/* Section 8 */}
          <section id="project-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">08.</span> Project &amp; Portfolio Information
            </h2>
            <p>
              In our practical project workspace, students submit project deliverables, including document links, code or technical file repositories, operational summaries, and self-assessments. In addition, registered students may create a professional portfolio profile containing a headline, professional bio, target industry role, skills inventory, and social profile links (such as LinkedIn or GitHub).
            </p>
          </section>

          {/* Section 9 */}
          <section id="certificate-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">09.</span> Certificate Information
            </h2>
            <p>
              Upon successful completion of course requirements, IndustryMentor generates a credential record that contains the student’s full legal name, course title, unique certificate credential ID, issue date, and verification status. This record is used to generate downloadable PDF certificates and support public credential authentication.
            </p>
          </section>

          {/* Section 10 */}
          <section id="payment-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">10.</span> Payment &amp; Transaction Information
            </h2>
            <p>
              Currently, course enrollment fee settlements are recorded through manual transaction verification for local Mobile Financial Services (MFS) including bKash and Nagad, as well as Direct Bank Transfer. When submitting enrollment, we collect:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Selected payment channel (e.g., bKash, Nagad, or Bank Transfer).</li>
              <li>Sender mobile phone number or sending account identifier.</li>
              <li>Transaction ID (TxID) generated by the financial service provider.</li>
              <li>Total payable amount and transaction timestamp.</li>
            </ul>
            <p className="mt-2">
              <em>Third-Party Payment Providers:</em> Where payments in the future are processed through an integrated third-party payment gateway, applicable payment card or banking information will be processed directly by that payment provider according to its own privacy policy and terms. IndustryMentor does not store sensitive cardholder data, CVV numbers, or banking PINs.
            </p>
          </section>

          {/* Section 11 */}
          <section id="technical-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">11.</span> Technical Information &amp; Storage
            </h2>
            <p>
              When accessing our website, standard web server logs may temporarily record basic technical data such as IP address, browser type, operating system, and request timestamps to ensure server health, network security, and defense against malicious requests. We do not use this technical data to profile individual visitors.
            </p>
          </section>

          {/* Section 12 */}
          <section id="how-we-use" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">12.</span> How We Use Information
            </h2>
            <p>We use the personal information we collect solely for the following legitimate purposes:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>To establish, authenticate, and manage student and administrator accounts.</li>
              <li>To verify payment transaction IDs and activate classroom course access.</li>
              <li>To deliver LMS video lessons, curriculum modules, and technical resource downloads.</li>
              <li>To facilitate student project submissions, instructor reviews, and actionable feedback.</li>
              <li>To issue verifiable certificates of completion and maintain our public verification registry.</li>
              <li>To respond to customer support inquiries and mentorship requests.</li>
              <li>To maintain platform security, prevent fraudulent transactions, and comply with legal requirements.</li>
            </ul>
          </section>

          {/* Section 13 */}
          <section id="how-we-share" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">13.</span> How We Share Information
            </h2>
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-foreground font-medium mb-3">
              IndustryMentor does not sell, rent, lease, or trade your personal information to marketing brokers, third-party advertisers, or data aggregators.
            </div>
            <p>
              We only share personal information under the following limited and necessary circumstances:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>With Technical Service Providers:</strong> Trusted cloud and database infrastructure providers that host our systems under strict confidentiality agreements.</li>
              <li><strong>For Public Portfolios &amp; Credential Verification:</strong> Information you intentionally designate as public (detailed in Sections 16 and 17).</li>
              <li><strong>Legal Compliance:</strong> When required by applicable law, lawful judicial process, or government authority to protect legal rights, prevent fraud, or ensure user safety.</li>
            </ul>
          </section>

          {/* Section 14 */}
          <section id="service-providers" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">14.</span> Service Providers &amp; Infrastructure
            </h2>
            <p>
              Our web application is deployed and served through <strong>Cloudflare Pages</strong>, providing global Content Delivery Network (CDN) distribution, DDoS mitigation, and HTTPS SSL/TLS encryption. Cloudflare processes incoming web requests solely to deliver site assets securely and efficiently.
            </p>
          </section>

          {/* Section 15 */}
          <section id="supabase-cloud" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">15.</span> Cloud Infrastructure &amp; Database
            </h2>
            <p>
              Our backend database, file storage, and authentication services are hosted on <strong>Supabase</strong> (PostgreSQL infrastructure). Database access is safeguarded through database-level <strong>Row Level Security (RLS)</strong> policies, which ensure that students can only view and modify their own personal records, while administrative write capabilities are strictly restricted to authenticated administrators.
            </p>
          </section>

          {/* Section 16 */}
          <section id="public-portfolio" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">16.</span> Public Portfolio Data vs. Private Account Data
            </h2>
            <p>
              We maintain a strict operational distinction between your private student account information and public profile information:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 font-bold text-foreground mb-2">
                    <Lock className="h-4 w-4 text-amber-500" /> Private Account Data
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your phone number, payment details, transaction IDs, private course lesson notes, submission drafts, and account passwords remain completely private and accessible only to you and authorized administrators.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 font-bold text-foreground mb-2">
                    <Eye className="h-4 w-4 text-primary" /> Public Portfolio Data
                  </div>
                  <p className="text-xs text-muted-foreground">
                    If you enable "Public" visibility on your student portfolio (<code className="text-primary">/portfolio/:slug</code>), your selected display name, headline, bio, verified certificates, and approved showcase projects will be visible to external employers and visitors. You may toggle your portfolio to "Private" at any time in your dashboard.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Section 17 */}
          <section id="cert-verification" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">17.</span> Certificate Verification Information
            </h2>
            <p>
              To uphold the integrity of credentials issued by IndustryMentor, our platform provides a public certificate verification registry (<code className="text-primary">/verify/:id</code>). When an employer or third party queries a valid certificate ID, the system confirms the student’s name, course completed, issue date, and verification status. No private contact details (such as phone numbers or physical addresses) are revealed via the verification portal.
            </p>
          </section>

          {/* Section 18 */}
          <section id="data-security" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">18.</span> Data Security Measures
            </h2>
            <p>
              We implement comprehensive technical and organizational safeguards to protect your information against unauthorized access, loss, alteration, or disclosure:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Transport Encryption:</strong> 100% of website and API communications are encrypted in transit via modern HTTPS (TLS 1.3).</li>
              <li><strong>Database Protection:</strong> Row Level Security (RLS) policies enforce multi-tenant isolation at the database layer.</li>
              <li><strong>Access Control:</strong> Administrative interfaces are restricted to verified administrators via role-based access control (RBAC).</li>
              <li><strong>Credential Protection:</strong> Sensitive API keys, database secrets, and service credentials are protected within server environment variables and never exposed to client browsers.</li>
            </ul>
          </section>

          {/* Section 19 */}
          <section id="data-retention" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">19.</span> Data Retention Policy
            </h2>
            <p>
              We retain personal information for as long as your account remains active or as needed to provide you with ongoing course access, maintain historical certificate verification records, resolve disputes, and comply with accounting and legal recordkeeping requirements. Upon account deletion requests, personal identifying records are removed or anonymized, except where retention of certificate completion history is legitimately required.
            </p>
          </section>

          {/* Section 20 */}
          <section id="user-rights" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">20.</span> User Rights &amp; Data Control
            </h2>
            <p>Depending on your jurisdiction, you maintain key rights regarding your personal data:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Access:</strong> The right to review the personal information we hold concerning your account.</li>
              <li><strong>Correction:</strong> The right to update or correct inaccurate or incomplete profile information directly via your dashboard.</li>
              <li><strong>Visibility:</strong> The right to switch your student portfolio from public to private visibility at any time.</li>
              <li><strong>Deletion:</strong> The right to request closure of your account and deletion of your stored personal records.</li>
            </ul>
          </section>

          {/* Section 21 */}
          <section id="data-requests" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">21.</span> Account &amp; Data Requests
            </h2>
            <p>
              To submit an official data inquiry, export request, or account deletion request, please reach out through our official contact portal at <Link to="/contact-us" className="text-primary hover:underline">/contact-us</Link> using your registered account email. We review and respond to authenticated requests within a reasonable operational timeframe.
            </p>
          </section>

          {/* Section 22 */}
          <section id="children-privacy" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">22.</span> Children's Privacy
            </h2>
            <p>
              IndustryMentor is an adult professional education and career development platform intended for university students, working professionals, and industry practitioners. We do not knowingly solicit or collect personal information from individuals under the age of 16. If we discover that an account has been registered by a minor without parental consent, we will take immediate steps to deactivate the account and delete the associated data.
            </p>
          </section>

          {/* Section 23 */}
          <section id="external-links" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">23.</span> External Links &amp; Third Parties
            </h2>
            <p>
              Our website may contain links to external third-party sites, including industry mentor LinkedIn profiles, research publications, external resource drives, and professional associations. We are not responsible for the privacy practices, content, or data collection policies of external third-party websites. We encourage you to review their individual policies.
            </p>
          </section>

          {/* Section 24 */}
          <section id="cookies-storage" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">24.</span> Cookies &amp; Browser Storage
            </h2>
            <p>
              IndustryMentor does not utilize intrusive tracking cookies, third-party advertising pixels, or behavioral tracking networks.
            </p>
            <p className="mt-2">
              We utilize strictly necessary browser storage mechanisms (such as standard browser <code className="text-primary">localStorage</code>) solely to preserve your active authentication session token and essential client-side interface state. These technical tokens are required for you to navigate between courses, submit project assignments, and remain logged in.
            </p>
          </section>

          {/* Section 25 */}
          <section id="policy-updates" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">25.</span> Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically to reflect enhancements in our platform features, operational adjustments, or updates in legal standards. When modifications are made, the "Effective Date" at the top of this document will be revised. Significant updates will be communicated through platform notices or direct account notifications.
            </p>
          </section>

          {/* Section 26 */}
          <section id="contact-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">26.</span> Contact Information
            </h2>
            <p>
              If you have questions, feedback, or concerns regarding this Privacy Policy or our data handling practices, please contact our support administration through our verified channels:
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Online Support</div>
                    <Link to="/contact-us" className="text-xs text-primary hover:underline mt-1 block">
                      Contact Support Form
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Direct Support Phone</div>
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
