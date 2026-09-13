# IndustryMentor — Phase 7: Projects, Portfolio & Certificates
## Architecture Audit & Production Implementation Plan

**Document Version:** 1.0.0  
**Status:** ARCHITECTURE AUDIT & SPECIFICATION ONLY (NO SQL EXECUTED, NO CODE CHANGED)  
**Target Platform:** IndustryMentor (https://industrymentor.net/)  
**Database Engine:** PostgreSQL 15+ (Supabase) with Row Level Security (RLS)  
**Author:** Senior Product Architect, Database Architect & Supabase Security Engineer  
**Date:** September 2026  

---

## 1. Executive Summary & Current-State Audit

IndustryMentor connects practical vocational learning with verifiable employment outcomes in export apparel manufacturing, merchandising, industrial engineering, quality assurance, and factory operations.

Following the successful execution and live verification of:
- **Phase 0 / Phase 2:** P0 Security Hardening, enrollment integrity, and tamper-resistant certificate verification RPC
- **Phase 3:** Premium Design System, Navigation, and Homepage
- **Phase 4:** Course Discovery, Syllabus Detail, and Enrolled Classroom LMS
- **Phase 5:** Verified Mentor Directory, Mentor Profiles, and Mentorship Inquiry Triage
- **Phase 6:** Career Pathway + Skill System (Public UI, Supabase migration with 6 relational tables, verified production data, and Admin Career & Skill CMS)

The verified live production Career & Skill data currently consists of:
- `career_paths` = 3 (Garment Merchandising & Sourcing, Apparel Production & Industrial Engineering, Production Quality Assurance & Compliance)
- `skills` = 9 (3 core skills per pathway)
- `career_path_skills` = 9
- `skill_courses` = 7
- `skill_mentors` = 8
- `skill_library_items` = 5
- `courses` = 3
- `mentors` = 3
- `library_items` = 3

The objective of **Phase 7** is to close the pedagogical loop from learning to career proof:
```
Career Path
    ↓
Skills
    ↓
Courses
    ↓
Practical Projects
    ↓
Student Project Submission
    ↓
Portfolio Evidence
    ↓
Course / Project Completion
    ↓
Certificate
    ↓
Public Certificate Verification
```

> [!IMPORTANT]
> **Audit & Architecture Phase Only:** In strict adherence to project directives, **NO SQL HAS BEEN EXECUTED**, **NO DATABASE MIGRATION HAS BEEN APPLIED**, **NO PRODUCTION SCHEMA HAS BEEN ALTERED**, **NO MOCK RECORDS HAVE BEEN CREATED**, **NO DEPLOYMENT HAS OCCURRED**, and **NO GIT COMMITS OR PUSHES HAVE BEEN MADE**. All findings in this document reflect verified live database queries and codebase audits.

---

## 2. Existing Project & Certificate Architecture

A comprehensive audit of the entire frontend and backend codebase was conducted to identify any preexisting project, portfolio, or certificate artifacts.

### 2.1 Project Artifacts in Codebase
- **Database Tables:** 0 tables exist. Queries to PostgREST for `projects`, `project_categories`, `project_submissions`, and `student_projects` confirmed: `Could not find the table in the schema cache` (HTTP 404).
- **Frontend Components:**
  - `src/components/sections/ProjectsTeaserSection.tsx`: Homepage teaser section displaying 3 static cards (*"Garment Tech-Pack Execution"*, *"SMV & Line Balancing Models"*, *"Defect Classification & Quality SOPs"*) with a button linking to `/courses`.
  - Global Navigation (`src/components/SiteNavbar.tsx`): Static anchor link `{ to: "/#projects", label: "Projects" }`.
  - Global Footer (`src/components/SiteFooter.tsx`): Static link `<NavLink to="/#projects">Projects</NavLink>`.
  - Classroom Interactive Checklist (`src/pages/CourseLearning.tsx`): Practical execution checklist (`practicalChecklist`) rendered in-memory per module, but without database persistence or submission tracking.
- **Routes:** No `/projects`, `/projects/:slug`, or `/admin/projects` routes exist.

### 2.2 Portfolio Artifacts in Codebase
- **Database Tables:** 0 tables exist. Queries to PostgREST for `portfolio`, `portfolios`, and `portfolio_items` confirmed: `Could not find the table in the schema cache` (HTTP 404).
- **Frontend Mentions:** Mentioned purely as step 4 (*"Build Portfolio"*) in `CareerPathwaySection.tsx` and `Career.tsx`.
- **Routes:** No `/portfolio`, `/portfolio/:slug`, or `/admin/portfolios` routes exist.

### 2.3 Certificate Artifacts in Codebase
- **Database Tables:** `public.certificates` exists in production.
- **Frontend Components:**
  - `src/features/certificates/CertificateGenerator.tsx`: Dynamic client-side certificate renderer and PDF exporter using `html2canvas` and `jsPDF`.
  - `src/pages/VerifyCertificate.tsx`: Public certificate verification page mounted at `/verify/:id`.
  - `src/features/admin/CertificatesAdmin.tsx`: Admin management panel at `/admin/certificates`.
  - `src/pages/Dashboard.tsx` (`CertificatesSection`): Student dashboard tab allowing certificate requesting and PDF downloading.

---

## 3. Existing Database Tables Audit

Below is the verified schema and status of all relevant tables in the live Supabase instance:

| Table Name | Status in Live DB | Verified Columns | Existing Constraints & Foreign Keys |
|---|---|---|---|
| `certificates` | **EXISTS** (Active) | `id`, `user_id`, `course_id`, `purchase_id`, `issued_at`, `certificate_path`, `status`, `created_at` | Primary Key: `id` (uuid); `course_id` → `courses.id`; `purchase_id` → `purchases.id`; `UNIQUE(user_id, course_id)` |
| `course_enrollments` | **EXISTS** (Active) | `id`, `user_id`, `course_id`, `purchase_id`, `completed`, `status`, `transaction_id`, `payment_method`, `sender_phone`, `created_at` | Primary Key: `id` (uuid); `course_id` → `courses.id`; `purchase_id` → `purchases.id`; `UNIQUE(user_id, course_id)` |
| `courses` | **EXISTS** (3 rows) | `id`, `slug`, `title`, `description`, `price_cents`, `published`, `cover_image_path`, `mode`, `badge_text`, `instructor_heading`, `created_at`, `updated_at` | Primary Key: `id` (uuid); `UNIQUE(slug)` |
| `course_modules` | **EXISTS** (11 rows) | `id`, `course_id`, `title`, `description`, `price_cents`, `created_at` | Primary Key: `id` (uuid); `course_id` → `courses.id` (ON DELETE CASCADE) |
| `profiles` | **EXISTS** (Active) | `id`, `user_id`, `full_name`, `created_at`, `updated_at` | Primary Key: `id` (uuid); `user_id` (uuid, UNIQUE); No username or slug exists! |
| `career_paths` | **EXISTS** (3 rows) | `id`, `slug`, `title`, `description`, `domain`, `practical_scope`, `icon_name`, `order_index`, `is_published`, `created_at`, `updated_at` | Primary Key: `id` (uuid); `UNIQUE(slug)` |
| `skills` | **EXISTS** (9 rows) | `id`, `slug`, `title`, `category`, `difficulty`, `summary`, `practical_exercise`, `is_published`, `order_index`, `created_at`, `updated_at` | Primary Key: `id` (uuid); `UNIQUE(slug)`; `CHECK (difficulty IN ('Foundational', 'Intermediate', 'Advanced'))` |
| `career_path_skills` | **EXISTS** (9 rows) | `career_path_id`, `skill_id`, `order_index`, `is_core`, `stage_tier` | Composite PK: `(career_path_id, skill_id)`; FKs to both parent tables |
| `skill_courses` | **EXISTS** (7 rows) | `skill_id`, `course_id`, `order_index` | Composite PK: `(skill_id, course_id)`; FKs to both parent tables |
| `skill_mentors` | **EXISTS** (8 rows) | `skill_id`, `mentor_id`, `order_index` | Composite PK: `(skill_id, mentor_id)`; FKs to both parent tables |
| `skill_library_items` | **EXISTS** (5 rows) | `skill_id`, `library_item_id`, `order_index` | Composite PK: `(skill_id, library_item_id)`; FKs to both parent tables |
| `projects` | **DOES NOT EXIST** | N/A | Table not in schema cache |
| `project_categories` | **DOES NOT EXIST** | N/A | Table not in schema cache |
| `project_submissions` | **DOES NOT EXIST** | N/A | Table not in schema cache |
| `student_projects` | **DOES NOT EXIST** | N/A | Table not in schema cache |
| `portfolios` / `portfolio` | **DOES NOT EXIST** | N/A | Table not in schema cache |
| `portfolio_items` | **DOES NOT EXIST** | N/A | Table not in schema cache |
| `certificate_requests` | **DOES NOT EXIST** | N/A | Requests are stored directly inside `certificates.status = 'pending'` |
| `certificate_verification`| **DOES NOT EXIST** | N/A | Verification uses `public.get_verified_certificate(uuid)` RPC |

---

## 4. Existing Routes Audit

From `src/App.tsx`, the complete existing routing configuration is:

### Public Routes
- `/`: Homepage (`src/pages/Index.tsx`)
- `/courses`: Course Catalog (`src/pages/Courses.tsx`)
- `/courses/:courseId`: Course Detail (`src/pages/CourseDetail.tsx`)
- `/library`: Industrial E-Books & SOPs (`src/pages/Library.tsx`)
- `/mentors`: Verified Mentor Directory (`src/pages/Mentors.tsx`)
- `/mentors/:mentorId`: Mentor Profile (`src/pages/MentorProfile.tsx`)
- `/career`: Career Pathway & Skill Discovery (`src/pages/Career.tsx`)
- `/contact` & `/contact-us`: Platform Contact (`src/pages/Contact.tsx`)
- `/auth`: Authentication / Sign In / Sign Up (`src/pages/Auth.tsx`)
- `/blogs` & `/blog`: Blog Articles Index (`src/pages/Blogs.tsx`)
- `/blog/:slug`: Single Blog Post (`src/pages/BlogPost.tsx`)
- `/reset-password`: Account Password Reset (`src/pages/ResetPassword.tsx`)
- `/stopwatch`: Industrial SMV / Time-Study Tool (`src/pages/Stopwatch.tsx`)
- `/verify/:id`: Public Certificate Verification (`src/pages/VerifyCertificate.tsx`)

### Authenticated Student Routes (`RequireAuth`)
- `/dashboard`: Student Dashboard (`src/pages/Dashboard.tsx`)
- `/enroll/:courseId`: Enrollment Checkout (`src/pages/CourseEnrollment.tsx`)
- `/learn/:courseId`: Distraction-Free Classroom LMS (`src/pages/CourseLearning.tsx`)

### Admin Routes (`RequireAdmin`)
- `/admin`: Dashboard Overview (`src/pages/admin/AdminDashboard.tsx`)
- `/admin/users`: User Management (`src/features/admin/UsersAdmin.tsx`)
- `/admin/courses`: Course CMS (`src/features/admin/CoursesAdmin.tsx`)
- `/admin/blogs`: Blog CMS (`src/features/admin/BlogsAdmin.tsx`)
- `/admin/mentors`: Mentor Directory CMS (`src/features/admin/MentorsAdmin.tsx`)
- `/admin/content`: Library CMS (`src/features/admin/LibraryAdmin.tsx`)
- `/admin/certificates`: Certificate Approvals & Issuance (`src/features/admin/CertificatesAdmin.tsx`)
- `/admin/messages`: Inquiry & Contact Center (`src/features/admin/MessagesAdmin.tsx`)
- `/admin/finance`: Financial Ledger (`src/features/admin/FinanceAdmin.tsx`)
- `/admin/favicon`: Favicon CMS (`src/features/admin/FaviconAdmin.tsx`)
- `/admin/settings`: Platform Site Settings (`src/features/admin/SettingsAdmin.tsx`)
- `/admin/career-skills`: Career & Skill CMS (`src/features/admin/career-skills/CareerSkillsAdmin.tsx`)

---

## 5. Existing Certificate Workflow Audit

The audit of `CourseLearning.tsx`, `Dashboard.tsx`, `CertificatesAdmin.tsx`, `CertificateGenerator.tsx`, and `VerifyCertificate.tsx` reveals the exact end-to-end certificate lifecycle:

```
Enrolled Student in LMS (/learn/:courseId)
    ↓
Marks All Modules & Clicks "Mark Entire Course Complete"
    ↓
DB: course_enrollments.completed set to true
    ↓
Student Navigates to /dashboard ("My Certificates" tab)
    ↓
Course appears under "Ready for Certificate"
    ↓
Student clicks "Request Certificate"
    ↓
DB: Upsert into public.certificates:
    { user_id, course_id, status: 'pending', certificate_path: '' }
    ↓
Admin opens /admin/certificates ("Pending Requests" section)
    ↓
Admin reviews student request and clicks "Approve" (or "Reject")
    ↓
DB: certificates.status updated to 'approved' (issued_at = now())
    + System notification inserted into public.notifications
    ↓
Student returns to /dashboard -> Certificate appears under "Earned Certificates"
    ↓
Student clicks "Download PDF" -> CertificateGenerator renders off-screen DOM:
    - Injects dynamic QR code pointing to https://industrymentor.net/verify/{id}
    - Captures template via html2canvas (scale: 4, 1123x794px A4 landscape)
    - Generates client-side PDF via jsPDF and triggers browser download
    ↓
Anyone scans QR code or visits /verify/:id
    ↓
VerifyCertificate calls SECURITY DEFINER RPC public.get_verified_certificate(id)
    ↓
Displays authentic verification badge, student full_name, course title, and issue date
```

### Key Behavioral Discoveries:
1. **Dynamic Client-Side Generation:** Certificates are **never stored as static binary PDFs** in Supabase Storage. The column `certificate_path` holds an empty string placeholder `""`. The document is dynamically generated in the browser using SVG/HTML canvas rasterization.
2. **Duplicate Request Prevention:** Enforced at the database layer via `UNIQUE (user_id, course_id)`. A student cannot spam duplicate certificate rows for the same course.
3. **Approval Requirement:** The verification RPC `public.get_verified_certificate` strictly filters on `c.status = 'approved'`. Pending or rejected certificates return empty results and cannot be publicly validated.
4. **Revocation Support:** The admin can set status to `'rejected'` (or future `'revoked'`), which immediately invalidates the certificate on `/verify/:id`.

---

## 6. Existing Security Model Audit

The security model is built on Supabase PostgreSQL Row Level Security (RLS) with explicit helper functions and hardened policies established in Phase 0 / Phase 2:

### 6.1 Role Authorization Pattern
Role checks strictly use the database helper function:
```sql
public.has_role(auth.uid(), 'admin'::public.app_role)
```
Frontend code never relies on client-supplied JWT claims or service-role keys.

### 6.2 Existing `certificates` Table RLS Policies
```sql
-- Authenticated users can insert requests ONLY with status = 'pending'
CREATE POLICY "Users can insert certificate requests"
ON public.certificates FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (status IS NULL OR status = 'pending'));

-- Authenticated users can update requests ONLY with status = 'pending'
CREATE POLICY "Users can update their own certificate requests"
ON public.certificates FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id AND (status IS NULL OR status = 'pending'));

-- Users can view their own certificate records
CREATE POLICY "Users can view their own certificates"
ON public.certificates FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Public visitors can read ONLY approved certificates
CREATE POLICY "Public can view approved certificates"
ON public.certificates FOR SELECT TO public
USING (status = 'approved');

-- Admins can manage all certificate operations
CREATE POLICY "Admins can manage certificates"
ON public.certificates FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

### 6.3 Security Definer Verification RPC
To prevent Indirect Object Reference (IDOR) attacks or data leaks from `public.profiles` (which is restricted to owner/admin reads), the public verification route uses:
```sql
CREATE OR REPLACE FUNCTION public.get_verified_certificate(cert_id uuid)
RETURNS TABLE (
  id uuid,
  student_name text,
  course_title text,
  issued_at timestamptz,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(p.full_name, 'Verified Student') AS student_name,
    COALESCE(co.title, 'Professional Course') AS course_title,
    c.issued_at,
    c.status
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  LEFT JOIN public.courses co ON co.id = c.course_id
  WHERE c.id = cert_id
    AND c.status = 'approved'
  LIMIT 1;
END;
$$;
```
This function:
- Runs as `SECURITY DEFINER` with fixed `search_path = public`
- Filters exclusively on `status = 'approved'`
- Exposes ONLY non-sensitive attributes (`student_name`, `course_title`, `issued_at`, `status`)
- Completely shields `user_id`, email, purchase identifiers, and transaction metadata from anonymous visitors.

---

## 7. Existing Storage Model Audit

An inspection of migrations (`20260118071046_346bc285-fc90-4ce4-8b45-15ef1d82b34c.sql` and `20260909000000_p0_security_and_enrollment_hardening.sql`) reveals:
1. **Buckets Defined in Migrations:**
   - `library` (`public: false`): Admin-only upload, gated download for authenticated library buyers.
   - `certificates` (`public: false`): Created in initial migration, but unused by client-side PDF renderer.
   - `site_assets` / `site-assets` (`public: true`): Admin-only write, public read for platform branding/logos.
2. **User Uploads:** Currently, **regular authenticated users have NO upload permissions to any storage bucket**. All existing file uploads (course covers, library PDFs, site logos) are strictly admin-only.
3. **Implication for Phase 7:** Student project submissions cannot use arbitrary file uploads without creating a dedicated, hardened private bucket (`project_submissions`) or utilizing external URL deliverables (Google Sheets, OneDrive, Figma, GitHub).

---

## 8. Proposed Projects Architecture

To bridge industrial skills with verifiable output, we define a normalized, production-ready project model.

### 8.1 Core Principles
- Projects must represent authentic factory floor and buying house workflows (e.g., Time & Action calendars, Standard Minute Value line balancing, AQL inspection plans).
- Projects must be decoupled from rigid single-course constraints so they can demonstrate competencies across multiple skills and career pathways.
- Project content must be authored and managed via an Admin CMS without requiring hardcoded frontend updates.

### 8.2 Entity Definition: `public.projects`
```sql
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL,
  detailed_brief text NOT NULL, -- Markdown format with industrial context and requirements
  domain text NOT NULL, -- e.g., 'Merchandising & Sourcing', 'Industrial Engineering', 'Quality Assurance'
  difficulty text NOT NULL CHECK (difficulty IN ('Foundational', 'Intermediate', 'Advanced')),
  estimated_hours integer NOT NULL DEFAULT 10,
  deliverables jsonb NOT NULL DEFAULT '[]'::jsonb, -- Structured array of required outputs
  evaluation_criteria jsonb NOT NULL DEFAULT '[]'::jsonb, -- Review rubric checklist
  starter_resources jsonb NOT NULL DEFAULT '[]'::jsonb, -- Reference files, SOP templates, tech pack links
  is_published boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 8.3 Project ↔ Career Path Relationship (`public.project_career_paths`)
**Recommendation: Normalized Many-to-Many.**
- *Rationale:* Industrial tasks frequently bridge functions. For example, *"Garment Tech-Pack Execution & BOM Costing"* is vital to both Garment Merchandisers and Quality Compliance Officers. A many-to-many relationship prevents project duplication.
```sql
CREATE TABLE IF NOT EXISTS public.project_career_paths (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  career_path_id uuid NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0,
  is_core boolean NOT NULL DEFAULT true,
  PRIMARY KEY (project_id, career_path_id)
);
```

### 8.4 Project ↔ Skills Relationship (`public.project_skills`)
**Recommendation: Normalized Many-to-Many.**
- *Rationale:* Completing a project proves operational capability in 2 to 4 discrete skills from our Phase 6 skill catalog.
```sql
CREATE TABLE IF NOT EXISTS public.project_skills (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, skill_id)
);
```

---

## 9. Proposed Project Submission Architecture

### 9.1 Conceptual Model
A submission represents a student's attempted solution to a practical project.

### 9.2 Entity Definition: `public.project_submissions`
```sql
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  submission_notes text, -- Student explanation of methodology and constraints
  deliverable_url text NOT NULL, -- Link to deliverables (Google Sheets, OneDrive, Figma, GitHub, Google Drive)
  file_path text, -- Optional Supabase storage path if file uploaded
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'revision_required')),
  admin_feedback text, -- Practitioner feedback, CAPA requirements, or praise
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id) -- One active project submission per student per project
);
```

### 9.3 Evaluation / Grading Model Recommendation
- **Choice: Approved / Revision Required with Structured Feedback.**
- *Rationale:* Numerical 0-100 scores fail to reflect manufacturing reality. In export garment manufacturing, technical packs and production audits are either accepted or sent back for corrective action (CAPA). "Approved / Revision Required" provides clear, actionable industry feedback without academic bureaucracy.

---

## 10. Proposed Portfolio Architecture

### 10.1 Student Portfolio Model
Currently, `public.profiles` only stores `id, user_id, full_name`. To preserve profile simplicity while supporting shareable, recruiter-friendly student portfolios, we introduce a decoupled `public.portfolios` model.

### 10.2 Entity Definition: `public.portfolios`
```sql
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE, -- User-defined or auto-generated public handle (e.g. /portfolio/johndoe)
  headline text, -- e.g., "Apparel Merchandiser | TNA & Costing Specialist"
  bio text, -- Professional practitioner summary
  career_path_id uuid REFERENCES public.career_paths(id) ON DELETE SET NULL,
  location text,
  contact_email text,
  linkedin_url text,
  github_url text,
  is_public boolean NOT NULL DEFAULT false, -- Strict privacy control: student decides when to publish
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 10.3 Entity Definition: `public.portfolio_items`
To ensure portfolio items point to verifiable source records rather than duplicated data:
```sql
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('project_submission', 'certificate', 'custom')),
  project_submission_id uuid REFERENCES public.project_submissions(id) ON DELETE CASCADE,
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE,
  custom_title text,
  custom_description text,
  custom_url text,
  order_index integer NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_portfolio_submission UNIQUE (portfolio_id, project_submission_id),
  CONSTRAINT unique_portfolio_certificate UNIQUE (portfolio_id, certificate_id)
);
```

---

## 11. Proposed Certificate Architecture & Continuity

### 11.1 Preserving Existing Certificates
The existing `public.certificates` table and `/verify/:id` route are live in production. They must NOT be broken or replaced.

### 11.2 Extending for Project Credentials & Pathway Credentials
To allow certificates to represent both course completions and practical project credentials without breaking schema:
1. Make `course_id` in `certificates` nullable, OR keep `course_id` for course certificates and add an optional `project_id uuid REFERENCES public.projects(id)` and `credential_type text DEFAULT 'course' CHECK (credential_type IN ('course', 'project', 'career_path'))`.
2. Add table constraint:
   ```sql
   CHECK (
     (credential_type = 'course' AND course_id IS NOT NULL) OR
     (credential_type = 'project' AND project_id IS NOT NULL) OR
     (credential_type = 'career_path')
   )
   ```
3. Update `public.get_verified_certificate(cert_id uuid)` to resolve either `courses.title` or `projects.title`:
   ```sql
   CREATE OR REPLACE FUNCTION public.get_verified_certificate(cert_id uuid)
   RETURNS TABLE (
     id uuid,
     student_name text,
     credential_title text,
     credential_type text,
     issued_at timestamptz,
     status text
   ) ...
   ```
4. This preserves 100% backward compatibility for all existing course verification links while unlocking project credential verification.

---

## 12. Entity Relationship Diagram

```
                 +-------------------+
                 |   career_paths    |
                 +-------------------+
                   | 1             | 1
                   |               |
                   | M             | M
        +--------------------+   +-----------------------+
        | career_path_skills |   | project_career_paths  |
        +--------------------+   +-----------------------+
                   | M                     | M
                   |                       |
                   | 1                     | 1
             +------------+         +-------------+
             |   skills   |---------|   projects  |
             +------------+ M     M +-------------+
                   | 1              (project_skills)
                   |                       | 1
                   | M                     |
             +------------+                | M
             |skill_courses|        +---------------------+
             +------------+         | project_submissions |
                   | M                     +---------------------+
                   |                               | 1
                   | 1                             |
             +------------+                        |
             |  courses   |                        |
             +------------+                        |
                   | 1                             |
                   |                               |
                   | M                             | M
            +--------------+             +-----------------+
            | certificates |-------------| portfolio_items |
            +--------------+ 1         M +-----------------+
                   | 1                             | M
                   |                               |
                   |                               | 1
             +------------+              +-----------------+
             | auth.users |--------------|   portfolios    |
             +------------+ 1          1 +-----------------+
```

---

## 13. Row Level Security (RLS) Strategy

All future tables must implement strict RLS using the established `public.has_role(auth.uid(), 'admin'::public.app_role)` pattern.

### 13.1 `projects`
- **SELECT (Public):** `USING (is_published = true)`
- **SELECT (Admin):** `USING (public.has_role(auth.uid(), 'admin'))`
- **INSERT / UPDATE / DELETE (Admin):** `WITH CHECK (public.has_role(auth.uid(), 'admin'))`

### 13.2 `project_skills` & `project_career_paths`
- **SELECT (Public):** `USING (true)`
- **INSERT / UPDATE / DELETE (Admin):** `WITH CHECK (public.has_role(auth.uid(), 'admin'))`

### 13.3 `project_submissions`
- **SELECT (Owner):** `USING (auth.uid() = user_id)`
- **SELECT (Admin):** `USING (public.has_role(auth.uid(), 'admin'))`
- **SELECT (Public):** Only if approved AND linked to a published portfolio item:
  ```sql
  USING (
    status = 'approved' AND EXISTS (
      SELECT 1 FROM public.portfolio_items pi
      JOIN public.portfolios p ON p.id = pi.portfolio_id
      WHERE pi.project_submission_id = public.project_submissions.id
        AND p.is_public = true
    )
  )
  ```
- **INSERT (Authenticated Student):** `WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'submitted'))`
- **UPDATE (Owner):** `USING (auth.uid() = user_id AND status IN ('draft', 'revision_required')) WITH CHECK (auth.uid() = user_id AND status IN ('draft', 'submitted'))`
- **UPDATE (Admin):** `USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'))`

### 13.4 `portfolios`
- **SELECT (Public):** `USING (is_public = true)`
- **SELECT (Owner):** `USING (auth.uid() = user_id)`
- **SELECT (Admin):** `USING (public.has_role(auth.uid(), 'admin'))`
- **INSERT / UPDATE (Owner):** `USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
- **ALL (Admin):** `USING (public.has_role(auth.uid(), 'admin'))`

### 13.5 `portfolio_items`
- **SELECT (Public):** `USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.is_public = true))`
- **SELECT / INSERT / UPDATE / DELETE (Owner):** `USING (EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid()))`

---

## 14. Storage Strategy

### 14.1 Submission Delivery Options
In industrial environments, student work consists of:
- Excel spreadsheets (TNA calendars, SMV calculations, Line balancing matrices)
- PDF documentation (Factory SOP manuals, Root cause CAPA reports, Buyer audit files)
- Design sheets (Tech pack breakdowns, BOM sheets)

### 14.2 Hybrid Storage Architecture
1. **Primary Deliverable (MVP): External URL / Cloud Drive**
   - Students provide shareable links (Google Sheets, Google Drive, OneDrive, Figma, GitHub).
   - *Benefits:* Zero server egress costs, supports live collaborative spreadsheets, works immediately without complex multipart chunked file upload edge-cases.
2. **Secondary Deliverable (Hardened File Upload): Private `project_submissions` Bucket**
   - Create private storage bucket: `project_submissions` (`public: false`).
   - Restrict path: `${auth.uid()}/${submission_id}/${filename}`.
   - Storage RLS:
     - Student can upload/read only within their own `${auth.uid()}` folder.
     - Admins can read all submission objects.
     - Public access strictly prohibited; portfolio previews use time-limited signed URLs (e.g. 3600s TTL).

---

## 15. Admin CMS Requirements

To maintain operational autonomy, an admin interface must be provided in `/admin`:

### 15.1 Project CMS (`/admin/projects`)
- **List View:** Table of projects showing title, domain, difficulty, published state, and linked skills/pathways.
- **Project Editor Modal / Drawer:**
  - Slug (auto-generated from title or editable)
  - Title, Short Description, Detailed Brief (Markdown preview)
  - Domain selector, Difficulty selector
  - Estimated hours
  - Deliverables builder (dynamic list of required items)
  - Starter resources builder (resource name + download/doc URL)
  - Published toggle
- **Relationships Manager:** Multi-select skill checkboxes and career path checkboxes.

### 15.2 Project Submissions CMS (`/admin/submissions`)
- **Triage Queue:** Filterable by status (`submitted`, `in_review`, `approved`, `revision_required`).
- **Review Drawer:**
  - Student identity, project title, submission timestamp.
  - Deliverable URL link (opens in new tab) and student notes.
  - Evaluation rubric checklist.
  - Action buttons: **Approve Submission** or **Request Revision**.
  - Practitioner feedback textarea.
  - Submitting an approval or revision triggers a student notification via `public.notifications`.

---

## 16. Student UX Journey

The complete step-by-step student experience:

1. **Discovery:** Student visits `/career` or `/projects` and explores practical industrial projects matching their career pathway.
2. **Preparation:** Student reviews the project brief, prerequisites, and required deliverables. If a related course is needed, links to `/courses/:courseId` guide preparation.
3. **Execution:** Student downloads starter SOP templates and prepares their industrial work (e.g., TNA calendar in Excel).
4. **Submission:** Student accesses the submission form on `/projects/:slug`, pastes their deliverable link, provides practitioner commentary, and submits.
5. **Review Notification:** Student receives a notification when an admin/mentor reviews their deliverable.
6. **Portfolio Curation:** Once approved, the student navigates to `/dashboard` (Portfolio tab), configures their public slug (e.g. `/portfolio/abdullah`), toggles `is_public = true`, and features their approved project.
7. **Proof of Skill:** The student shares their public portfolio link on LinkedIn or CVs for recruiters.
8. **Credential Verification:** For completed milestone projects, verified certificates can be issued and verified instantly at `/verify/:id`.

---

## 17. Public Route Strategy & SEO

### 17.1 Public Routes
- `/projects`: Public directory of practical projects. Filterable by Domain, Difficulty, and Career Path. High SEO value for industrial vocational search terms (*"Garment TNA project case study"*, *"Apparel line balancing practical exercise"*).
- `/projects/:slug`: Detailed project specification page. Provides indexed technical specifications and learning outcomes.
- `/portfolio/:slug`: Student public portfolio page.
  - If `is_public = true`: Renders student practitioner profile, approved projects, and verified certificates.
  - If `is_public = false`: Returns a clean "This portfolio is private" message and sends `<meta name="robots" content="noindex" />`.
- `/verify/:id`: Existing certificate verification page. Unchanged and fully backward-compatible.

---

## 18. MVP vs. Future Scope

| Capability | MVP Scope (Phase 7 Prompts 2 - 4) | Future Scope |
|---|---|---|
| Project Catalog | Public `/projects` and `/projects/:slug` | Interactive in-browser spreadsheet editor |
| Deliverables | URL deliverables (Google Sheets/Drive/OneDrive/GitHub) + notes | Direct chunked file upload to private bucket with virus scan |
| Grading | Approved / Revision Required with practitioner feedback | Multi-stage mentor peer review rubrics |
| Portfolio | Single portfolio per user with public slug and privacy toggle | Multi-portfolio themes and custom domain mapping |
| Certificates | Existing course certificates preserved + project credential support | Micro-credential badges and OpenBadges 3.0 export |
| Admin CMS | Projects CMS + Submissions Review Triage | Bulk export of submission data & mentor assignment |

---

## 19. Migration Plan (Phase 7 Prompt 2)

A dedicated database migration will be required for Phase 7 Prompt 2:
- Migration file: `supabase/migrations/20260911_projects_portfolio_system.sql`
- Strategy: **Purely additive and non-destructive**.
- Steps:
  1. `CREATE TABLE IF NOT EXISTS public.projects`
  2. `CREATE TABLE IF NOT EXISTS public.project_career_paths`
  3. `CREATE TABLE IF NOT EXISTS public.project_skills`
  4. `CREATE TABLE IF NOT EXISTS public.project_submissions`
  5. `CREATE TABLE IF NOT EXISTS public.portfolios`
  6. `CREATE TABLE IF NOT EXISTS public.portfolio_items`
  7. Optional non-destructive extension of `public.certificates` (`project_id`, `credential_type`)
  8. Apply all RLS policies using `public.has_role(auth.uid(), 'admin')`
  9. Add `updated_at` triggers
  10. Seed verified initial industrial projects matching our 3 verified career pathways.

---

## 20. Risks & Security Concerns

1. **Privilege Escalation on Submissions:** A malicious user could attempt to submit an update with `status = 'approved'`.
   - *Mitigation:* RLS `WITH CHECK` strictly enforces that non-admin authenticated users can only insert or update records with `status IN ('draft', 'submitted')`. Only admins can set `status = 'approved'`.
2. **IDOR & PII Exposure on Portfolios:** Anonymous visitors might attempt to scrape unapproved submissions or private user emails.
   - *Mitigation:* RLS strictly permits public reads on `project_submissions` only when approved and explicitly featured on a public portfolio. User emails in `portfolios` are optional display fields explicitly controlled by the user.
3. **Malicious File Uploads / Phishing Links:** Student submission URLs could contain malicious links.
   - *Mitigation:* Submission URLs are validated against URL format schemes (`http://`, `https://`) and rendered with `rel="noopener noreferrer nofollow"` in the admin and portfolio views.
4. **Certificate Verification Tampering:**
   - *Mitigation:* The existing `get_verified_certificate` RPC is untouched and remains the single source of truth for public certificate verification.

---

## 21. Recommended Implementation Order

1. **Phase 7 Prompt 1 (Current):** Complete architectural audit and specification document (`docs/PHASE_7_ARCHITECTURE.md`) and deliver final structured report.
2. **Phase 7 Prompt 2:** Database migration file (`20260911_projects_portfolio_system.sql`), safe execution in Supabase, and TypeScript type updates.
3. **Phase 7 Prompt 3:** Public Projects Directory (`/projects`), Project Detail (`/projects/:slug`), and Student Submission UI.
4. **Phase 7 Prompt 4:** Admin Projects CMS (`/admin/projects`) and Submissions Review Center (`/admin/submissions`).
5. **Phase 7 Prompt 5:** Student Portfolio (`/portfolio/:slug`), Dashboard Portfolio Editor, and Verification Integration.
