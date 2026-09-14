# Legal & Policy Pages Implementation Report — IndustryMentor

**Document Version:** 1.0  
**Effective Date:** September 14, 2026  
**Audited Platform:** IndustryMentor ([https://industrymentor.net](https://industrymentor.net))  
**Repository:** [https://github.com/01912895591/industrymentor](https://github.com/01912895591/industrymentor)  

---

## 1. Executive Summary

This implementation delivers three comprehensive, production-ready, and transparent legal and operational policy pages for the IndustryMentor platform:
1. **Privacy Policy** (`/privacy-policy`)
2. **Terms of Service** (`/terms-of-service`)
3. **Refund & Cancellation Policy** (`/refund-policy`)

All policies are grounded strictly in the actual audited architecture and behavior of the application without fabricating unverified business practices, imaginary payment gateways, or unverified legal accreditations.

---

## 2. Routes & Components Created / Modified

| Component | File Path | Route / Context | Purpose |
| :--- | :--- | :--- | :--- |
| **PrivacyPolicy** | `src/pages/PrivacyPolicy.tsx` | `/privacy-policy` | 26-section detailed privacy policy covering account data, public portfolios, RLS, and data rights |
| **TermsOfService** | `src/pages/TermsOfService.tsx` | `/terms-of-service` | 28-section terms of service featuring explicit "No Employment Guarantee", IP rights, and acceptable use |
| **RefundPolicy** | `src/pages/RefundPolicy.tsx` | `/refund-policy` | 16-section refund & cancellation policy reflecting manual MFS/Bank payment verification workflow |
| **App.tsx** | `src/App.tsx` | App Root Routing | Lazy-loaded routes for `/privacy-policy`, `/terms-of-service`, and `/refund-policy` |
| **SiteFooter.tsx** | `src/components/SiteFooter.tsx` | Global Footer | Integrated navigation links in Company column and footer bottom legal bar |
| **Auth.tsx** | `src/pages/Auth.tsx` | Registration Modal | Legal acknowledgement linking to Terms of Service and Privacy Policy |
| **CourseEnrollment.tsx** | `src/pages/CourseEnrollment.tsx` | Checkout & Payment | Legal acknowledgement linking to Terms, Privacy, and Refund policies |
| **legalPolicies.test.tsx** | `src/test/legalPolicies.test.tsx` | Vitest Suite | Unit tests verifying headings, sections, disclaimers, and contact details |

---

## 3. Audited Application Architecture & Data Practices

### 3.1 Authentication & User Data
- **Registration Fields:** Full Name, Phone Number, Email, and Password.
- **Authentication:** Managed via Supabase Auth (cryptographically salted and hashed passwords; client cannot access raw passwords).
- **Session Tokens:** JWT stored in client browser `localStorage` under `sb-<project-ref>-auth-token`.
- **User Profiles:** Stored in `profiles` table (`id`, `user_id`, `full_name`, `phone`, `email`, `created_at`).

### 3.2 Course Enrollment & Payment Workflow
- **Current Payment Model:** Manual payment verification for local Mobile Financial Services (MFS): **bKash**, **Nagad**, and **Direct Bank Transfer**.
- **Data Collected on Enrollment:** `course_id`, `user_id`, `payment_method`, `sender_phone`, `transaction_id`, `amount_cents`.
- **Status Lifecycle:** `pending` (verification in progress) → `active` (approved by admin) or `cancelled`.
- **Automated Gateway:** Not currently integrated (SSLCommerz, Stripe, etc. are not active). The policies clearly state that third-party gateways will process transactions under their own policies when integrated.
- **Automated Refund API:** None. Refunds require manual administrative review and ledger verification.

### 3.3 Public vs. Private Student Data
- **Public Portfolios:** Students can toggle portfolio visibility (`is_public = true` / `false`). If public, `/portfolio/:slug` displays display name, headline, bio, verified certificates, and approved project deliverables.
- **Private Data:** Phone numbers, payment details, transaction IDs, lesson notes, and draft submissions are restricted via PostgreSQL **Row Level Security (RLS)**.
- **Certificate Verification:** Publicly available at `/verify/:id` to authenticate genuine completion credentials without exposing private contact info.

### 3.4 Mentorship Inquiries
- Mentorship requests are submitted to the `messages` table with subject `Mentorship Inquiry: <Mentor Name>`.
- No automated live scheduling or instant paid booking is currently implemented. Policies accurately describe this as an inquiry process.

### 3.5 Third-Party Tracking & Cookies
- No Google Analytics, Facebook Pixel, or advertising trackers are present in `index.html` or source code.
- Browser storage (`localStorage`) is used strictly for technical session maintenance and UI preferences.

---

## 4. Critical Policy Disclaimers & Clauses

### 4.1 Mandatory Policy Review Notice
As required, every policy page concludes with the following notice:
> *"These policies are provided for general informational and operational purposes and should be reviewed by qualified legal counsel before final commercial use."*

### 4.2 Explicit "No Employment Guarantee"
In `TermsOfService.tsx` (Section 20):
- Explicitly states that IndustryMentor provides educational and skill development resources only.
- Does **not** guarantee employment, job placement, salary increases, promotion, passing corporate interviews, or specific factory profitability.

### 4.3 Course Access Duration
In `TermsOfService.tsx` (Section 6):
- Formulated accurately as: *"Course access is provided according to the access terms presented at the time of enrollment and may be subject to applicable platform or course-specific conditions."*
- Does not invent an arbitrary "lifetime unlimited" promise.

---

## 5. Business Decisions Required

The following business items cannot be guessed or fabricated and require final decision from the business owner prior to final commercial launch:

| Item | Status | Note / Recommendation |
| :--- | :--- | :--- |
| **Refund Eligibility Period** | **REFUND PERIOD REQUIRES BUSINESS OWNER DECISION** | Define exact calendar window (e.g., 3 days, 7 days, or 14 days) and rule regarding whether viewing Lesson 1 in LMS voids refund eligibility. |
| **Official Legal Entity Name** | Pending Confirmation | Formal legal name (e.g., *IndustryMentor Limited*, *IndustryMentor Enterprise*, or sole proprietorship). |
| **Registered Business Address** | Active Default | Currently standardized to: `25/2, Salimuddin Market Road, Mirpur-1, Dhaka, Bangladesh`. Confirm if this is the registered head office. |
| **Official Legal Contact Email** | Pending Confirmation | Dedicated legal address (e.g., `legal@industrymentor.net` or `support@industrymentor.net`). Code currently falls back to verified support form. |
| **Governing Law / Jurisdiction** | Pending Confirmation | Governing jurisdiction (recommended: *Laws of the People's Republic of Bangladesh / Courts of Dhaka*). |
| **Future Payment Gateway Terms** | Future Phase | Update terms when automated gateways (SSLCommerz, Shurjopay, bKash Merchant API) are activated. |

---

## 6. SEO & Accessibility Implementation

- **SEOHead Integration:** Each page includes customized `<title>`, `<meta name="description">`, and `<link rel="canonical">`.
- **Search Engine Indexing:** All three policy pages are fully indexable (`noindex = false`).
- **Semantic HTML:** Utilizes `<h1>`, `<h2>`, `<section>`, `<ol>`, `<ul>`, and Lucide icons.
- **Accessibility & Contrast:** Conforms to WCAG AA color contrast standards on dark and light backgrounds.
- **Navigation:** Deep-linking supported via internal table of contents anchor tags with smooth scroll offsets (`scroll-mt-24`).

---

## 7. Security Audit & Credential Safety

A repository scan verified that:
- **Zero API keys or service credentials** are exposed in policy files.
- **Zero Supabase service_role keys** or database passwords appear in public code or documentation.
- Client-side data access continues to be governed by Supabase RLS and environment variables.

---

## 8. Verification & Test Results

- **TypeScript Compilation (`npx tsc --noEmit`):** 0 errors (Exit code 0).
- **Automated Test Suite (`npm test -- --run`):** 39/39 passed across 8 test files.
- **Production Build (`npm run build`):** Clean build completed in 7.04s.
- **Local Dev Server Verification:** HTTP 200 confirmed on:
  - `http://localhost:8080/privacy-policy`
  - `http://localhost:8080/terms-of-service`
  - `http://localhost:8080/refund-policy`
