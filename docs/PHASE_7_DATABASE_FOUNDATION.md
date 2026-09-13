# IndustryMentor — Phase 7: Projects, Portfolio & Submission Database Foundation
## Architecture & Migration Specification Document (Security Hardened)

**Document Version:** 1.1.0  
**Phase:** Phase 7 — Prompt 2 (Security Hardening Revision)  
**Status:** MIGRATION PREPARATION & SPECIFICATION ONLY (NO LIVE SQL EXECUTED)  
**Target Migration File:** `supabase/migrations/20260910220000_phase7_projects_portfolios_foundation.sql`  
**Target Platform:** IndustryMentor (https://industrymentor.net/)  
**Database Engine:** PostgreSQL 15+ (Supabase) with Row Level Security (RLS)  
**Author:** Senior Product Architect + Database Architect + Supabase Security Engineer  
**Date:** September 2026  

---

## 1. What Was Inspected

In preparation for this database foundation migration, the following codebase and live Supabase assets were re-inspected:
1. **Existing Migrations:**
   - `supabase/migrations/20260118044334_1611d912-0665-40e6-af2f-a8a4863e9500.sql` (profiles table, `update_updated_at_column()` function)
   - `supabase/migrations/20260118050156_f8d38309-a86b-4f5a-9c9f-f1e1d81096e5.sql` (`has_role` authorization function)
   - `supabase/migrations/20260118071046_346bc285-fc90-4ce4-8b45-15ef1d82b34c.sql` (`courses`, `course_enrollments`, `certificates`, storage buckets)
   - `supabase/migrations/20260909000000_p0_security_and_enrollment_hardening.sql` (P0 certificate status policies and `get_verified_certificate(uuid)` RPC)
   - `supabase/migrations/20260910_career_skill_system.sql` (Phase 6 career & skill tables and CMS)
2. **PostgREST Schema Verification:**
   - Queried table endpoints for `projects`, `project_categories`, `project_submissions`, `student_projects`, `portfolios`, `portfolio_items`. All returned 404 (*"Could not find table in schema cache"*).
   - Re-verified live tables: `career_paths` (3), `skills` (9), `career_path_skills` (9), `skill_courses` (7), `skill_mentors` (8), `skill_library_items` (5), `courses` (3), `mentors` (3), `library_items` (3).
3. **Application & Verification Routes:**
   - `/verify/:id` (`src/pages/VerifyCertificate.tsx`)
   - `/dashboard` (`src/pages/Dashboard.tsx`)
   - `/admin/certificates` (`src/features/admin/CertificatesAdmin.tsx`)

---

## 2. Existing Schema Findings

- **`certificates` System:** Live in production with columns `id`, `user_id`, `course_id`, `purchase_id`, `issued_at`, `certificate_path`, `status`, `created_at`. Protected by Phase 0/2 RLS policies (preventing non-admin privilege escalation) and exposed publicly strictly through `public.get_verified_certificate(uuid)` when `status = 'approved'`.
- **`profiles` System:** Only contains `id`, `user_id`, `full_name`, `created_at`, `updated_at`. Contains no username, handle, or bio columns.
- **Trigger Conventions:** Standardized on `public.update_updated_at_column()` running `BEFORE UPDATE`.
- **Authorization Helper:** Standardized on `public.has_role(auth.uid(), 'admin'::public.app_role)`.

---

## 3. New Tables Created in Migration

The migration creates exactly six new relational tables:

1. `public.projects`
2. `public.project_career_paths`
3. `public.project_skills`
4. `public.project_submissions`
5. `public.portfolios`
6. `public.portfolio_items`

Zero additional tables were created. No AI, analytics, recommendation, or storage metadata tables were introduced.

---

## 4. Table Purposes & Specifications

### 4.1 `public.projects`
- **Purpose:** Central repository of practical industrial projects reflecting export garment manufacturing, merchandising, industrial engineering, and quality assurance workflows.
- **Fields:**
  - `id uuid primary key default gen_random_uuid()`
  - `slug text unique not null` (format restricted to lowercase kebab-case)
  - `title text not null`
  - `short_description text not null`
  - `detailed_brief text` (Markdown brief)
  - `domain text` (e.g. 'Merchandising & Sourcing', 'Industrial Engineering', 'Quality Assurance')
  - `difficulty text` (`CHECK (difficulty IN ('Foundational', 'Intermediate', 'Advanced'))`)
  - `estimated_hours integer` (`CHECK (estimated_hours >= 0)`)
  - `learning_objectives jsonb default '[]'::jsonb`
  - `deliverables jsonb default '[]'::jsonb`
  - `evaluation_criteria jsonb default '[]'::jsonb`
  - `instructions text`
  - `resources jsonb default '[]'::jsonb`
  - `mentor_guidance text`
  - `is_published boolean not null default false`
  - `order_index integer not null default 0 CHECK (order_index >= 0)`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`

### 4.2 `public.project_career_paths`
- **Purpose:** Many-to-many junction mapping projects to existing `career_paths`.
- **Primary Key:** `(project_id, career_path_id)`
- **Foreign Keys:**
  - `project_id REFERENCES public.projects(id) ON DELETE CASCADE`
  - `career_path_id REFERENCES public.career_paths(id) ON DELETE CASCADE`
- **Fields:** `order_index integer not null default 0 CHECK (order_index >= 0)`

### 4.3 `public.project_skills`
- **Purpose:** Many-to-many junction mapping projects to existing `skills`.
- **Primary Key:** `(project_id, skill_id)`
- **Foreign Keys:**
  - `project_id REFERENCES public.projects(id) ON DELETE CASCADE`
  - `skill_id REFERENCES public.skills(id) ON DELETE CASCADE`
- **Fields:**
  - `is_primary boolean not null default false`
  - `order_index integer not null default 0 CHECK (order_index >= 0)`

### 4.4 `public.project_submissions`
- **Purpose:** Stores student project submissions for evaluation and portfolio inclusion.
- **Primary Key:** `id uuid primary key default gen_random_uuid()`
- **Foreign Keys:**
  - `project_id REFERENCES public.projects(id) ON DELETE CASCADE`
  - `user_id REFERENCES auth.users(id) ON DELETE CASCADE`
  - `reviewed_by REFERENCES auth.users(id) ON DELETE SET NULL`
- **Constraints:**
  - `UNIQUE (project_id, user_id)` (one active submission per student per project)
  - `CHECK (status IN ('submitted', 'in_review', 'approved', 'revision_required'))`
  - `CHECK (deliverable_url IS NULL OR (deliverable_url ~* '^https?://[^[:space:]]+$' AND deliverable_url !~* '^(javascript|data|file):'))`

### 4.5 `public.portfolios`
- **Purpose:** Student professional portfolio entity decoupled from the simple `profiles` table.
- **Primary Key:** `id uuid primary key default gen_random_uuid()`
- **Foreign Keys:**
  - `user_id REFERENCES auth.users(id) ON DELETE CASCADE` (One-to-One: `UNIQUE(user_id)`)
  - `career_path_id REFERENCES public.career_paths(id) ON DELETE SET NULL`
- **Constraints:**
  - `UNIQUE(slug)` with kebab-case format check (3 to 60 characters)
  - `CHECK (linkedin_url IS NULL OR (linkedin_url ~* '^https?://[^[:space:]]+$' AND linkedin_url !~* '^(javascript|data|file):'))`
  - `is_public boolean not null default false`

### 4.6 `public.portfolio_items`
- **Purpose:** Junction linking a student's portfolio to approved project submissions and/or authentic certificates.
- **Primary Key:** `id uuid primary key default gen_random_uuid()`
- **Foreign Keys:**
  - `portfolio_id REFERENCES public.portfolios(id) ON DELETE CASCADE`
  - `project_submission_id REFERENCES public.project_submissions(id) ON DELETE CASCADE`
  - `certificate_id REFERENCES public.certificates(id) ON DELETE CASCADE`
- **Constraints:**
  - Exactly one source: `CHECK ((project_submission_id IS NOT NULL AND certificate_id IS NULL) OR (project_submission_id IS NULL AND certificate_id IS NOT NULL))`
  - Uniqueness: `UNIQUE (portfolio_id, project_submission_id)`, `UNIQUE (portfolio_id, certificate_id)`
  - `CHECK (order_index >= 0)`

---

## 5. Relationships & Foreign Key Map

```
public.projects (1)
  ├──< public.project_career_paths (M) >── (1) public.career_paths
  ├──< public.project_skills (M) >──────── (1) public.skills
  └──< public.project_submissions (M) >─── (1) auth.users
                                 ^
                                 │ (1)
                                 │
                     public.portfolio_items (M)
                                 │
                                 ├──> (1) public.certificates
                                 │
                                 └──> (1) public.portfolios (1) >─── (1) auth.users
```

---

## 6. Row Level Security (RLS) Model & Security Hardening Revision

RLS is enabled on all 6 tables with hardened, non-overlapping policies:

| Table | Public Access | Authenticated Owner Access | Admin Access (`has_role`) |
|---|---|---|---|
| `projects` | SELECT published (`is_published = true`) | SELECT published | Full CRUD |
| `project_career_paths` | SELECT mappings for published projects | SELECT mappings for published projects | Full CRUD |
| `project_skills` | SELECT mappings for published projects | SELECT mappings for published projects | Full CRUD |
| `project_submissions` | SELECT approved submissions via `is_submission_public(id)` | SELECT, INSERT (status='submitted'), UPDATE (status in ('submitted','revision_required')) | Full CRUD (review, feedback, approve) |
| `portfolios` | SELECT public portfolios (`is_public = true`) | Full CRUD on own portfolio (`user_id = auth.uid()`) | Full CRUD |
| `portfolio_items` | SELECT valid items via `is_portfolio_item_public(id)` | Full CRUD on own portfolio items (MUST be approved and owned by `auth.uid()`) | Full CRUD |

---

## 7. Security Hardening Details

### 7.1 Source Verification on Portfolio Item INSERT and UPDATE
- **The Issue:** A user could attempt to showcase another student's work, an unapproved submission draft, or a pending certificate request.
- **The Resolution:** RLS `WITH CHECK` on `portfolio_items` for both `INSERT` and `UPDATE` strictly enforces:
  1. `p.user_id = auth.uid()` (Parent portfolio must belong to the caller).
  2. If `project_submission_id` is provided:
     `EXISTS (SELECT 1 FROM public.project_submissions ps WHERE ps.id = portfolio_items.project_submission_id AND ps.user_id = auth.uid() AND ps.status = 'approved')`
     (Submission must exist, belong to the caller, and be explicitly `approved`).
  3. If `certificate_id` is provided:
     `EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = portfolio_items.certificate_id AND c.user_id = auth.uid() AND c.status = 'approved')`
     (Certificate must exist, belong to the caller, and be explicitly `approved`).

### 7.2 Hardened Public Visibility via `is_portfolio_item_public(item_id)`
- **The Issue:** A public visitor querying `portfolio_items` on a public portfolio could potentially see draft/pending items if a student bypassed application logic.
- **The Resolution:** Public SELECT on `portfolio_items` is gated by `public.is_portfolio_item_public(id)`.
  - Runs with `SECURITY DEFINER` and `SET search_path = public`.
  - Verifies:
    1. Parent portfolio is active and `is_public = true`.
    2. Underlying project submission is `status = 'approved'` AND belongs to the portfolio owner (`ps.user_id = p.user_id`).
    3. Underlying certificate is `status = 'approved'` AND belongs to the portfolio owner (`c.user_id = p.user_id`).
  - Completely prevents RLS recursion because it runs with table-owner privileges.

### 7.3 Hardened `is_submission_public(sub_id)`
- Restricted to minimal necessary logic:
  ```sql
  SELECT EXISTS (
    SELECT 1
    FROM public.portfolio_items pi
    JOIN public.portfolios p ON p.id = pi.portfolio_id
    JOIN public.project_submissions s ON s.id = pi.project_submission_id
    WHERE pi.project_submission_id = sub_id
      AND s.user_id = p.user_id
      AND s.status = 'approved'
      AND p.is_public = true
  );
  ```
- Enforces that the submission owner and portfolio owner are identical, the submission status is `approved`, and the portfolio is `is_public = true`.

---

## 8. URL Validation Approach

- `deliverable_url` and `linkedin_url` are validated via CHECK constraints against dangerous URL protocols:
  - Must begin with `http://` or `https://`
  - Must NOT contain whitespace (`[^[:space:]]+`)
  - Must NOT match `^(javascript|data|file):`

---

## 9. Portfolio Privacy Model

- Each portfolio includes `is_public boolean NOT NULL DEFAULT false`.
- Private portfolios remain completely invisible to anonymous visitors.
- Neither private portfolios, their portfolio items, nor unapproved student submissions can be scraped.

---

## 10. Certificate Integration Approach

- **`public.certificates` Table was NOT MODIFIED.** Zero columns added.
- Existing certificate status logic, PDF generation, and public verification RPC remain 100% untouched.
- `public.portfolio_items` safely references `public.certificates(id)` with source verification.

---

## 11. What Was Intentionally NOT Changed

1. **`public.certificates` Table:** Zero changes.
2. **`public.get_verified_certificate(uuid)` RPC:** Zero changes.
3. **Routes:** `/verify/:id`, `/admin/certificates`, etc. remain untouched.
4. **No Storage Buckets Created:** Deferred to future iteration.
5. **No Fake Seed Data:** Database tables start completely empty.

---

## 12. Future Storage & Upload Plan

- In a future phase, a private `project_submissions` storage bucket will support direct file uploads with time-limited signed URLs for portfolio previews.

---

## 13. Future Project Credential Considerations

- Standalone project completion credentials can be integrated in a later phase without breaking existing course certificates.

---

## 14. Migration Filename

`supabase/migrations/20260910220000_phase7_projects_portfolios_foundation.sql`

---

## 15. Verification Steps to Run After Manual Review

1. Execute the migration script in Supabase SQL Editor.
2. Run the Verification SQL script (provided in Section D of the security report).
3. Confirm that all 6 tables exist, all constraints are valid, RLS is enabled, and all 6 table counts equal 0.
