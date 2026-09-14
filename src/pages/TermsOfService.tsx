import React from "react";
import { Link } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  ShieldCheck,
  Award,
  AlertTriangle,
  Scale,
  Briefcase,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Lock,
} from "lucide-react";

export default function TermsOfService() {
  const lastUpdated = "September 14, 2026";

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "eligibility", title: "2. Eligibility" },
    { id: "account-reg", title: "3. Account Registration" },
    { id: "account-resp", title: "4. Account Responsibilities" },
    { id: "edu-services", title: "5. Educational Services" },
    { id: "course-access", title: "6. Course Access" },
    { id: "enrollment", title: "7. Enrollment & Verification" },
    { id: "mentorship", title: "8. Mentorship Inquiries" },
    { id: "projects", title: "9. Projects & Submissions" },
    { id: "portfolio", title: "10. Public & Private Portfolios" },
    { id: "certificates", title: "11. Certificates of Completion" },
    { id: "cert-verification", title: "12. Certificate Verification" },
    { id: "ip-rights", title: "13. Intellectual Property Rights" },
    { id: "user-content", title: "14. User-Generated Content" },
    { id: "acceptable-use", title: "15. Acceptable Use" },
    { id: "prohibited", title: "16. Prohibited Activities" },
    { id: "third-party", title: "17. Third-Party Services" },
    { id: "external-links", title: "18. External Links" },
    { id: "edu-disclaimer", title: "19. Educational Disclaimer" },
    { id: "no-employment", title: "20. No Employment Guarantee" },
    { id: "availability", title: "21. Service Availability" },
    { id: "termination", title: "22. Account Suspension & Termination" },
    { id: "refund-ref", title: "23. Refund & Cancellation Reference" },
    { id: "limitation", title: "24. Limitation of Liability" },
    { id: "indemnity", title: "25. Indemnification" },
    { id: "changes", title: "26. Changes to Terms" },
    { id: "governing-law", title: "27. Governing Law & Jurisdiction" },
    { id: "contact-info", title: "28. Contact Information" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-16 pt-8 sm:pt-12">
      <SEOHead
        title="Terms of Service — IndustryMentor"
        description="Review the terms and conditions governing the use of IndustryMentor courses, mentorship inquiries, project workspaces, and credentials."
        canonicalUrl="https://industrymentor.net/terms-of-service"
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-10 text-center sm:text-left">
          <Badge variant="outline" className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border-primary/30">
            Platform Agreement
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Terms of <span className="text-gradient">Service</span>
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

        {/* Terms Body */}
        <div className="space-y-12 text-sm sm:text-base leading-relaxed text-muted-foreground">
          {/* Section 1 */}
          <section id="acceptance" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">01.</span> Acceptance of Terms
            </h2>
            <p>
              These Terms of Service ("Terms") constitute a legally binding agreement between you ("User", "Student", or "You") and <strong>IndustryMentor</strong> ("IndustryMentor", "we", "us", or "our"), governing your access to and use of <a href="https://industrymentor.net" className="text-primary hover:underline">https://industrymentor.net</a>, including our course catalog, learning portal, project workspace, mentorship directory, resource library, and credential verification system.
            </p>
            <p className="mt-2">
              By accessing our website, creating an account, or enrolling in any course, you confirm that you have read, understood, and agreed to be bound by these Terms. If you do not agree to these Terms, you must not access or use the platform.
            </p>
          </section>

          {/* Section 2 */}
          <section id="eligibility" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">02.</span> Eligibility
            </h2>
            <p>
              To create an account and enroll in IndustryMentor courses, you must be at least 16 years of age and possess the legal capacity to enter into binding agreements. If you are registering on behalf of an institution, commercial business, or manufacturing organization, you represent that you possess the necessary authority to bind that entity to these Terms.
            </p>
          </section>

          {/* Section 3 */}
          <section id="account-reg" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">03.</span> Account Registration
            </h2>
            <p>
              When creating an account, you agree to provide truthful, accurate, and complete information, including your full legal name, valid email address, and verified phone number. Maintaining inaccurate or fraudulent registration details constitutes a breach of these Terms and may result in immediate suspension or deactivation of your account.
            </p>
          </section>

          {/* Section 4 */}
          <section id="account-resp" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">04.</span> Account Responsibilities
            </h2>
            <p>
              You are responsible for safeguarding your login credentials and for all activities conducted under your account. You agree not to share your account credentials or grant unauthorized access to any third party. If you suspect any breach of security, unauthorized use, or credential compromise, you must notify IndustryMentor administration immediately via <Link to="/contact-us" className="text-primary hover:underline">/contact-us</Link>.
            </p>
          </section>

          {/* Section 5 */}
          <section id="edu-services" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">05.</span> Educational Services
            </h2>
            <p>
              IndustryMentor provides specialized vocational, operational, and professional development content focused on the textile, apparel merchandising, and manufacturing management sectors. Services include self-paced video modules, technical standard operating procedures (SOPs), downloadable templates, practical project workspaces, mentor contact opportunities, and completion credentials.
            </p>
          </section>

          {/* Section 6 */}
          <section id="course-access" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">06.</span> Course Access
            </h2>
            <p>
              Course access is provided according to the access terms presented at the time of enrollment and may be subject to applicable platform or course-specific conditions. Access to classroom materials, video lessons, and interactive workspaces is granted strictly on a personal, non-transferable, and non-commercial educational license. IndustryMentor reserves the right to retire or update outdated curriculum content to maintain industry relevance.
            </p>
          </section>

          {/* Section 7 */}
          <section id="enrollment" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">07.</span> Enrollment &amp; Verification
            </h2>
            <p>
              Course enrollment requests are initiated through our online checkout portal. For manual payment options (including bKash, Nagad, and Bank Transfer), you must provide the accurate transaction ID and sender phone number. 
            </p>
            <p className="mt-2">
              Enrollments remain in a "pending" verification state until our finance administration validates the transaction against receiving records. Once verified, the enrollment status is updated to "active", unlocking the student classroom. IndustryMentor reserves the right to reject enrollment requests that submit invalid, duplicate, or unverified transaction IDs.
            </p>
          </section>

          {/* Section 8 */}
          <section id="mentorship" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">08.</span> Mentorship Inquiries
            </h2>
            <p>
              IndustryMentor showcases profiles of experienced industry practitioners to facilitate professional mentorship connections. 
            </p>
            <p className="mt-2">
              Submitting a mentorship inquiry through a mentor’s profile communicates your technical query and contact information to platform administrators and the respective mentor. Mentorship inquiries do not guarantee immediate live appointments, real-time availability, or a contract of employment. Mentorship engagements remain subject to mentor discretion, schedule availability, and platform guidelines.
            </p>
          </section>

          {/* Section 9 */}
          <section id="projects" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">09.</span> Projects &amp; Submissions
            </h2>
            <p>
              Certain courses and professional pathways require the completion of practical capstone projects submitted through our dedicated project workspace. 
            </p>
            <p className="mt-2">
              Submitted deliverables are reviewed by instructors and administrators according to established industry criteria. IndustryMentor does not guarantee that every submitted project will be approved upon first submission. Instructors may request revisions to ensure student work meets professional industry standards. Plagiarized, duplicate, or unoriginal submissions will be rejected.
            </p>
          </section>

          {/* Section 10 */}
          <section id="portfolio" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">10.</span> Public &amp; Private Portfolios
            </h2>
            <p>
              Students may build a digital portfolio to showcase verified credentials, approved project deliverables, and technical competencies. 
            </p>
            <p className="mt-2">
              You maintain complete control over your portfolio visibility setting ("Public" or "Private"). When designating a portfolio as Public (<code className="text-primary">/portfolio/:slug</code>), you acknowledge that your profile details and showcase deliverables are accessible to prospective employers and the public. You are solely responsible for ensuring you have all requisite rights to any content you upload and that public submissions do not disclose confidential proprietary factory or employer data.
            </p>
          </section>

          {/* Section 11 */}
          <section id="certificates" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">11.</span> Certificates of Completion
            </h2>
            <p>
              IndustryMentor issues digital Certificates of Completion to students who satisfy all specified course criteria, including module completion and required assignment submissions.
            </p>
            <p className="mt-2">
              Certificates verify the completion of specialized professional training administered by IndustryMentor. Unless explicitly verified and documented otherwise, IndustryMentor certificates are independent institutional credentials and do not represent formal university degrees or statutory government accreditations.
            </p>
          </section>

          {/* Section 12 */}
          <section id="cert-verification" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">12.</span> Certificate Verification
            </h2>
            <p>
              Each certificate issued by IndustryMentor is assigned an immutable credential ID registered within our public verification portal (<code className="text-primary">/verify/:id</code>). This verification service is provided to allow employers, institutions, and students to authenticate genuine completion records. IndustryMentor reserves the right to revoke or invalidate any certificate found to have been obtained through fraudulent activity, plagiarism, or breach of these Terms.
            </p>
          </section>

          {/* Section 13 */}
          <section id="ip-rights" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">13.</span> Intellectual Property Rights
            </h2>
            <p>
              All curriculum designs, instructional videos, slide presentations, technical SOPs, logos, graphic design assets, and website software code are the exclusive intellectual property of IndustryMentor and its licensors, protected by applicable copyright, trademark, and intellectual property laws.
            </p>
            <p className="mt-2">
              You are granted a limited, revocable, non-exclusive, non-transferable license to access and view course materials for your individual educational development. You may not reproduce, redistribute, broadcast, resell, publish, or commercially exploit any course materials without express prior written consent from IndustryMentor.
            </p>
          </section>

          {/* Section 14 */}
          <section id="user-content" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">14.</span> User-Generated Content
            </h2>
            <p>
              Students retain ownership of original intellectual property contained within their project submissions. By submitting assignments or showcasing work on a public portfolio, you grant IndustryMentor a non-exclusive, royalty-free, worldwide license to host, display, evaluate, and archive your submission strictly for educational assessment, credential verification, and platform operation purposes.
            </p>
          </section>

          {/* Section 15 */}
          <section id="acceptable-use" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">15.</span> Acceptable Use
            </h2>
            <p>
              You agree to use IndustryMentor solely for lawful, professional, and educational purposes. You agree to maintain academic integrity, communicate respectfully with instructors and industry mentors, and comply with all applicable local and international regulations.
            </p>
          </section>

          {/* Section 16 */}
          <section id="prohibited" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">16.</span> Prohibited Activities
            </h2>
            <p>You agree not to engage in any of the following prohibited actions:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Sharing or reselling your student account login credentials.</li>
              <li>Scraping, crawling, or extracting platform data, video streams, or resource files via automated scripts or tools.</li>
              <li>Reverse engineering, decompiling, or attempting to compromise website source code, APIs, or database systems.</li>
              <li>Submitting fraudulent, altered, or duplicate transaction identifiers during course enrollment.</li>
              <li>Uploading malicious code, viruses, or disruptive scripts through project submission forms.</li>
              <li>Harassing, abusing, or sending unsolicited commercial solicitations (spam) to instructors, mentors, or fellow students.</li>
            </ul>
          </section>

          {/* Section 17 */}
          <section id="third-party" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">17.</span> Third-Party Services
            </h2>
            <p>
              The platform may reference or integrate third-party tools (such as external video hosting players, cloud storage drives, or mobile payment services). Your interaction with third-party providers is governed by their respective service terms and privacy policies. IndustryMentor is not responsible for the performance or terms of third-party entities.
            </p>
          </section>

          {/* Section 18 */}
          <section id="external-links" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">18.</span> External Links
            </h2>
            <p>
              Our website may contain hyperlinks to external sites, research papers, or mentor profiles. These links are provided solely for educational reference and convenience. IndustryMentor does not endorse, control, or accept liability for the accuracy, legality, or content of external third-party sites.
            </p>
          </section>

          {/* Section 19 */}
          <section id="edu-disclaimer" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">19.</span> Educational Disclaimer
            </h2>
            <p>
              All course curriculum, templates, SOPs, and mentorship guidance provided on IndustryMentor are designed for general educational and professional development purposes. While content is developed by experienced industry practitioners, practical factory operations, merchandising negotiations, and manufacturing workflows require individual contextual judgment. IndustryMentor does not guarantee that application of course concepts will prevent commercial errors or ensure manufacturing success.
            </p>
          </section>

          {/* Section 20 - CRITICAL */}
          <section id="no-employment" className="scroll-mt-24">
            <div className="p-6 rounded-2xl border-2 border-amber-500/40 bg-amber-500/5">
              <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <span className="text-amber-500 font-mono text-sm">20.</span> No Employment Guarantee
              </h2>
              <p className="text-foreground font-semibold">
                IndustryMentor provides educational and professional skill development resources. Enrolling in courses, completing practical projects, receiving mentorship guidance, or earning a verified Certificate of Completion does NOT guarantee:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-1.5 text-muted-foreground">
                <li>Employment or job placement at any garment manufacturing factory, buying house, or commercial enterprise.</li>
                <li>Promotion, salary increase, or specific job title attainment with your current or future employers.</li>
                <li>Guaranteed passing of third-party employment recruitment tests or corporate interviews.</li>
                <li>Specific business profits, commercial contracts, or revenue outcomes for your enterprise.</li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Career progress depends upon personal diligence, market conditions, individual aptitude, and employer discretion. IndustryMentor makes no warranties regarding employment outcomes.
              </p>
            </div>
          </section>

          {/* Section 21 */}
          <section id="availability" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">21.</span> Service Availability
            </h2>
            <p>
              We strive to ensure continuous and reliable access to our platform. However, system maintenance, server upgrades, telecommunication disruptions, or unforeseen technical failures may cause intermittent service interruptions. IndustryMentor does not warrant that access will be uninterrupted, error-free, or 100% continuous at all times.
            </p>
          </section>

          {/* Section 22 */}
          <section id="termination" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">22.</span> Account Suspension &amp; Termination
            </h2>
            <p>
              IndustryMentor reserves the right to suspend, terminate, or restrict your access to any course or account at our sole discretion, without prior notice or liability, in the event of:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>A material breach of these Terms or academic integrity policies.</li>
              <li>Submission of fraudulent payment transaction IDs or chargeback disputes.</li>
              <li>Unauthorized distribution or recording of proprietary course materials.</li>
              <li>Harassment or abusive conduct directed toward instructors, mentors, or students.</li>
            </ul>
          </section>

          {/* Section 23 */}
          <section id="refund-ref" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">23.</span> Refund &amp; Cancellation Reference
            </h2>
            <p>
              All course enrollment fees, resource library purchases, and cancellation requests are governed by our official <Link to="/refund-policy" className="text-primary font-semibold hover:underline">Refund &amp; Cancellation Policy</Link>. Please review the Refund Policy carefully prior to submitting payment.
            </p>
          </section>

          {/* Section 24 */}
          <section id="limitation" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">24.</span> Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, IndustryMentor, its directors, employees, instructors, and mentors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, commercial opportunities, employment opportunities, data, or operational goodwill, arising out of or related to your use of or inability to use the platform.
            </p>
            <p className="mt-2">
              In no event shall the total aggregate liability of IndustryMentor for all claims relating to services exceed the amount actually paid by you to IndustryMentor for the specific course giving rise to the claim.
            </p>
          </section>

          {/* Section 25 */}
          <section id="indemnity" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">25.</span> Indemnification
            </h2>
            <p>
              You agree to defend, indemnify, and hold harmless IndustryMentor, its affiliates, instructors, and operational staff from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with your breach of these Terms, your project submissions, or your violation of third-party rights.
            </p>
          </section>

          {/* Section 26 */}
          <section id="changes" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">26.</span> Changes to Terms
            </h2>
            <p>
              We reserve the right to revise or modify these Terms at any time. When changes occur, the updated Terms will be posted on this page with an updated "Effective Date". Continued use of the platform following the posting of modifications indicates your acceptance of the revised Terms.
            </p>
          </section>

          {/* Section 27 */}
          <section id="governing-law" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">27.</span> Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These Terms shall be interpreted and governed in accordance with applicable laws governing commercial and educational operations. Any legal dispute, controversy, or claim arising out of or relating to these Terms or platform services shall be submitted to the competent jurisdiction of courts located in the platform's primary operating territory.
            </p>
          </section>

          {/* Section 28 */}
          <section id="contact-info" className="scroll-mt-24">
            <h2 className="text-xl font-bold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary font-mono text-sm">28.</span> Contact Information
            </h2>
            <p>
              For formal legal inquiries, terms clarifications, or rights notices, please reach out to our platform administration through our verified channels:
            </p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Official Support</div>
                    <Link to="/contact-us" className="text-xs text-primary hover:underline mt-1 block">
                      Contact Us Form
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40">
                <CardContent className="p-4 flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Administrative Helpline</div>
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
                    <div className="font-semibold text-foreground text-xs">Operating Location</div>
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
