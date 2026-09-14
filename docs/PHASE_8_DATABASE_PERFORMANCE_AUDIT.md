# Phase 8 — Database Performance, Index Audit & Query Optimization Report

**Target Production Instance**: Supabase (`fiirnhpsldouvnfvbtun`, AWS ap-south-1 Mumbai)  
**Platform**: IndustryMentor (React / Vite / TypeScript / Supabase PostgreSQL)  
**Date**: September 13, 2026  
**Status**: AUDIT COMPLETE — MIGRATION PREPARED (PENDING USER MANUAL EXECUTION)  

---

## 1. Executive Summary

As part of Phase 8 production optimization and hardening for IndustryMentor, a comprehensive database audit was performed across all 20 Supabase migrations, 24 application tables, Row Level Security (RLS) policies, and frontend query patterns throughout public, student, and admin workflows.

### Key Audit Findings:
1. **Unindexed Public Feeds**: The highest traffic public endpoints (`courses`, `blogs`, `mentors`, `library_items`) execute equality filters on status flags (`published = true`) coupled with reverse chronological sorting (`ORDER BY created_at DESC`). These lacked covering or composite indexes, resulting in sequential scans and in-memory sort operations on PostgreSQL.
2. **Phase 7 Projects & Portfolios Coverage**: The Phase 7 project system already possessed strong indexing for `projects`, `project_submissions`, and `portfolios`. Specifically, `project_submissions` already contains `UNIQUE (project_id, user_id)` and individual indexes on `project_id`, `user_id`, `status`, and `submitted_at DESC`. Creating `(user_id, project_id)` was evaluated and **rejected as 100% redundant**.
3. **Unindexed Foreign Keys**: In `course_enrollments` and `certificates`, the foreign keys to `course_id` lacked individual btree indexes. While composite unique constraints exist on `(user_id, course_id)`, PostgreSQL btree indexes only support leading-column seeks (`user_id`). Queries filtering by `course_id` alone (admin stats, course roster lookups, foreign key cascade checks) performed sequential scans.
4. **LMS & Portfolio Hierarchy Ordering**: Both `course_modules` and `portfolio_items` execute high-frequency parent-child lookups with explicit ordering (`WHERE course_id = ? ORDER BY order_index ASC` and `WHERE portfolio_id = ? ORDER BY order_index ASC`). Composite indexes eliminate the database sort phase entirely.

---

## 2. PostgreSQL Schema & Migration Inventory

The IndustryMentor database consists of 20 migrations executed in sequence:

| Migration File | Primary Focus |
|---|---|
| `20260118044334_1611d912-0665-40e6-af2f-a8a4863e9500.sql` | Core schema (`courses`, `course_modules`, `course_lessons`, `course_progress`) |
| `20260118050156_f8d38309-a86b-4f5a-9c9f-f1e1d81096e5.sql` | `course_enrollments`, `purchases`, initial RLS |
| `20260118071046_346bc285-fc90-4ce4-8b45-15ef1d82b34c.sql` | `library_items`, `finance_transactions`, transaction triggers |
| `20260118083322_a2c68c18-63dd-473e-9cef-b110d44d6ea8.sql` | `certificates` table, certificate generation trigger |
| `20260118093552_acbe6855-a86f-4107-8ed5-eb07ad06858e.sql` | Enrollment helper RPCs |
| `20260118094656_ccf68ab8-292a-4b2b-be50-ede5f8cb6fa1.sql` | Type alignment for library purchases |
| `20260119084557_create_blogs_table.sql` | `blogs` table creation |
| `20260120000001_add_library_industry.sql` | Library industry categorization |
| `20260120000002_create_site_settings.sql` | Site configuration key-value storage |
| `20260120000003_create_mentors.sql` | `mentors` table creation |
| `20260120000003_enable_enrollment_rls.sql` | RLS enablement for enrollments and purchases |
| `20260125000001_add_library_image.sql` | Library item image attachment support |
| `20260127000000_update_users_rpc.sql` | User management helper RPC |
| `20260127150000_create_site_settings.sql` | Idempotent site settings fallback |
| `20260127150001_add_logo_rpc.sql` | Branding logo RPC |
| `20260204170000_add_course_features.sql` | Course badge and feature flags |
| `20260909000000_p0_security_and_enrollment_hardening.sql` | P0 security hardening, `user_roles`, strict RLS, enrollment integrity |
| `20260910_career_skill_system.sql` | `career_paths`, `skills`, junction tables, career indexes |
| `20260910220000_phase7_projects_portfolios_foundation.sql` | `projects`, `project_submissions`, `portfolios`, `portfolio_items` |
| `20260913_database_performance_indexes.sql` *(NEW)* | Safe, idempotent index optimization for Phase 8 |

---

## 3. Existing Index Inventory (Before Phase 8 Migration)

### Explicit Indexes Existing Prior to Phase 8:
- **Projects & Portfolios** (created in `20260910220000`):
  - `idx_projects_slug` ON `projects(slug)`
  - `idx_projects_is_published` ON `projects(is_published)`
  - `idx_projects_order_index` ON `projects(order_index)`
  - `idx_projects_domain` ON `projects(domain)`
  - `idx_projects_difficulty` ON `projects(difficulty)`
  - `idx_project_career_paths_career_path_id` ON `project_career_paths(career_path_id)`
  - `idx_project_career_paths_order` ON `project_career_paths(order_index)`
  - `idx_project_skills_skill_id` ON `project_skills(skill_id)`
  - `idx_project_skills_is_primary` ON `project_skills(is_primary)`
  - `idx_project_skills_order` ON `project_skills(order_index)`
  - `idx_project_submissions_project_id` ON `project_submissions(project_id)`
  - `idx_project_submissions_user_id` ON `project_submissions(user_id)`
  - `idx_project_submissions_status` ON `project_submissions(status)`
  - `idx_project_submissions_submitted_at` ON `project_submissions(submitted_at DESC)`
  - `idx_portfolios_slug` ON `portfolios(slug)`
  - `idx_portfolios_user_id` ON `portfolios(user_id)`
  - `idx_portfolios_is_public` ON `portfolios(is_public)`
  - `idx_portfolios_career_path_id` ON `portfolios(career_path_id)`
  - `idx_portfolio_items_portfolio_id` ON `portfolio_items(portfolio_id)`
  - `idx_portfolio_items_submission_id` ON `portfolio_items(project_submission_id)`
  - `idx_portfolio_items_certificate_id` ON `portfolio_items(certificate_id)`
  - `idx_portfolio_items_order` ON `portfolio_items(order_index)`
  - `idx_portfolio_items_featured` ON `portfolio_items(is_featured)`
- **Careers & Skills** (created in `20260910`):
  - `idx_career_paths_slug` ON `career_paths(slug)`
  - `idx_career_paths_published` ON `career_paths(is_published, order_index)`
  - `idx_skills_slug` ON `skills(slug)`
  - `idx_skills_domain` ON `skills(domain)`
  - `idx_skills_published` ON `skills(is_published)`
  - `idx_career_path_skills_skill` ON `career_path_skills(skill_id)`
  - `idx_career_path_skills_order` ON `career_path_skills(order_index)`
  - `idx_skill_courses_course` ON `skill_courses(course_id)`
  - `idx_skill_mentors_mentor` ON `skill_mentors(mentor_id)`
  - `idx_skill_library_items_library` ON `skill_library_items(library_item_id)`
- **Implicit Constraint Indexes** (PostgreSQL B-Trees):
  - Primary keys on all tables (`*_pkey` on `id`)
  - `courses(slug)` UNIQUE
  - `blogs(slug)` UNIQUE
  - `mentors(email)` UNIQUE
  - `library_items(item_key)` UNIQUE
  - `course_enrollments(user_id, course_id)` UNIQUE
  - `certificates(certificate_number)` UNIQUE
  - `certificates(user_id, course_id)` UNIQUE
  - `purchases(user_id, item_type, item_key)` UNIQUE
  - `project_submissions(project_id, user_id)` UNIQUE
  - `portfolios(user_id)` UNIQUE

---

## 4. Application Query Pattern Audit

Every query in `src/` was mapped to identify table access patterns, predicates, sorting, and cardinality:

| Table | File / Component | Query Method | Predicates | Sorting | Frequency | Missing Index Impact |
|---|---|---|---|---|---|---|
| `courses` | `Courses.tsx`, `Index.tsx` | `.select()` | `published = true` | `created_at DESC` | High (Public) | Seq Scan + Sort |
| `blogs` | `Blog.tsx`, `CTASection.tsx` | `.select()` | `published = true` | `created_at DESC` | High (Public) | Seq Scan + Sort |
| `mentors` | `Mentors.tsx`, `Index.tsx` | `.select()` | None | `created_at ASC` | High (Public) | In-memory Sort |
| `messages` | `Messages.tsx` | `.select()` | None | `created_at DESC` | Medium (Admin) | In-memory Sort |
| `course_enrollments` | FK cascade / Admin stats | `.select()` | `course_id = ?` | None | Medium | Seq Scan on FK |
| `certificates` | `CertificatesAdmin.tsx` | `.select()` | None | `created_at DESC` | Medium (Admin) | In-memory Sort |
| `certificates` | FK cascade / verification | `.select()` | `course_id = ?` | None | Medium | Seq Scan on FK |
| `course_modules` | `CourseLearning.tsx`, LMS | `.select()` | `course_id = ?` | `order_index ASC` | High (Student) | Seq Scan + Sort |
| `portfolio_items` | `PortfolioShowcase.tsx` | `.select()` | `portfolio_id = ?` | `order_index ASC` | High (Student) | Sort after Filter |
| `library_items` | `Career.tsx`, `ResourceLibrary` | `.select()` | `published = true` | `created_at DESC` | Medium (Public) | Seq Scan + Sort |

---

## 5. Candidate Index Evaluation & Decisions

### 1. `courses`
- **Candidate**: `(published, created_at DESC)`
- **Evaluation**: Both public catalog (`Courses.tsx`) and homepage hero/cards query `.eq('published', true).order('created_at', { ascending: false })`. Furthermore, RLS evaluates `USING (published = true)`. A composite index allows index range scans without sorting.
- **Decision**: **RECOMMENDED** (`idx_courses_published_created_at`).

### 2. `blogs`
- **Candidate**: `(published, created_at DESC)`
- **Evaluation**: `Blog.tsx` and `CTASection.tsx` both filter by `published = true` and sort `created_at DESC`. RLS checks `published = true`.
- **Decision**: **RECOMMENDED** (`idx_blogs_published_created_at`).

### 3. `project_submissions`
- **Candidate**: `(user_id, project_id)` or `(submitted_at DESC)`
- **Evaluation**:
  - `UNIQUE (project_id, user_id)` is already indexed by PostgreSQL.
  - Phase 7 migration already created `idx_project_submissions_user_id` and `idx_project_submissions_project_id`.
  - Phase 7 already created `idx_project_submissions_submitted_at` on `submitted_at DESC`.
  - Creating `(user_id, project_id)` would be completely redundant with `UNIQUE (project_id, user_id)`.
- **Decision**: **NOT NEEDED** (Already fully indexed in Phase 7).

### 4. `portfolio_items`
- **Candidate**: `(portfolio_id, order_index ASC)`
- **Evaluation**: Phase 7 created `idx_portfolio_items_portfolio_id` and `idx_portfolio_items_order` (standalone). When rendering a portfolio showcase or editor, the application requests all items for a portfolio ordered by `order_index ASC`. The standalone index requires a sort step in memory. A composite index satisfies both the filter and the order directly.
- **Decision**: **RECOMMENDED** (`idx_portfolio_items_portfolio_order`).

### 5. `mentors`
- **Candidate**: `(created_at ASC)`
- **Evaluation**: `Mentors.tsx` and `Index.tsx` fetch mentors sorted by `created_at ASC`. No index on `created_at` existed previously.
- **Decision**: **RECOMMENDED** (`idx_mentors_created_at`).

### 6. `messages`
- **Candidate**: `(created_at DESC)`
- **Evaluation**: Admin messages dashboard queries all contact form submissions ordered by `created_at DESC`.
- **Decision**: **RECOMMENDED** (`idx_messages_created_at`).

### 7. `course_enrollments`
- **Candidate**: `(course_id)` vs `(user_id)`
- **Evaluation**:
  - Table has `UNIQUE (user_id, course_id)`. Because `user_id` is the leading column, queries on `WHERE user_id = ?` and `WHERE user_id = ? AND course_id = ?` use this index.
  - However, `course_id` is NOT indexed as a leading column. Any admin query aggregating course enrollment counts or FK cascade operations scanning enrollments by `course_id` result in table scans.
  - An index on `user_id` would be redundant.
- **Decision**: **RECOMMENDED `(course_id)`** (`idx_course_enrollments_course_id`). **REJECTED `(user_id)`**.

### 8. `certificates`
- **Candidate**: `(course_id)`, `(created_at DESC)`, `(certificate_number)`
- **Evaluation**:
  - `certificate_number` is already protected by a UNIQUE constraint, creating an index automatically.
  - `UNIQUE (user_id, course_id)` already covers `user_id`.
  - `course_id` is an unindexed foreign key.
  - Admin certificates dashboard sorts all certificates by `created_at DESC`.
- **Decision**: **RECOMMENDED `(course_id)` and `(created_at DESC)`**. **REJECTED `(certificate_number)` and `(user_id)`**.

### 9. `course_modules`
- **Candidate**: `(course_id, order_index ASC)`
- **Evaluation**: LMS syllabus viewers (`CourseLearning.tsx`, `CourseDetail.tsx`, `CourseEnrollment.tsx`, `CourseModulesViewer.tsx`) execute `.eq('course_id', courseId).order('order_index', { ascending: true })`. Neither `course_id` nor `order_index` was indexed.
- **Decision**: **RECOMMENDED** (`idx_course_modules_course_order`).

### 10. `library_items`
- **Candidate**: `(published, created_at DESC)`
- **Evaluation**: Resource library queries on `Career.tsx` and `ResourceLibrarySection.tsx` execute `.eq('published', true).order('created_at', { ascending: false })`.
- **Decision**: **RECOMMENDED** (`idx_library_items_published_created_at`).

---

## 6. Redundant Indexes Explicitly Avoided

To protect database write throughput and avoid disk bloat, the following candidate indexes were analyzed and intentionally **NOT** added:

1. **`project_submissions(user_id, project_id)`**:
   - *Reason*: `UNIQUE (project_id, user_id)` already indexes both columns. Equality seeks on two columns operate with identical efficiency regardless of column order in the index definition. Adding an inverted composite index would incur useless write overhead on every submission.
2. **`course_enrollments(user_id)`**:
   - *Reason*: `user_id` is the leading column of `UNIQUE (user_id, course_id)`. PostgreSQL B-tree can satisfy any query filtering by `user_id` alone using the existing unique index.
3. **`certificates(user_id)`**:
   - *Reason*: `user_id` is the leading column of `UNIQUE (user_id, course_id)`.
4. **`certificates(certificate_number)`**:
   - *Reason*: `certificate_number` already possesses a UNIQUE constraint which automatically maintains an underlying B-tree index.
5. **`courses(slug)`, `blogs(slug)`, `projects(slug)`, `portfolios(slug)`, `skills(slug)`, `career_paths(slug)`**:
   - *Reason*: All slug columns have UNIQUE constraints. Duplicate explicit indexes would waste storage and I/O.
6. **`purchases(user_id)`**:
   - *Reason*: `user_id` is the leading column of `UNIQUE (user_id, item_type, item_key)`.

---

## 7. Migration SQL Specification

File created: `supabase/migrations/20260913_database_performance_indexes.sql`

```sql
-- Phase 8 Prompt 3: Database Performance, Index Audit & Query Optimization
-- IndustryMentor Production Database Performance Migration
-- Target Supabase Project: fiirnhpsldouvnfvbtun (ap-south-1)
-- Safe, idempotent index creation for high-frequency queries and unindexed foreign keys

-- 1. COURSES: Public catalog filtering and reverse chronological ordering
CREATE INDEX IF NOT EXISTS idx_courses_published_created_at 
  ON public.courses(published, created_at DESC);

-- 2. BLOGS: Public blog feed filtering and reverse chronological ordering
CREATE INDEX IF NOT EXISTS idx_blogs_published_created_at 
  ON public.blogs(published, created_at DESC);

-- 3. MENTORS: Public mentor showcase ordering
CREATE INDEX IF NOT EXISTS idx_mentors_created_at 
  ON public.mentors(created_at ASC);

-- 4. MESSAGES: Admin inbox reverse chronological ordering
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
  ON public.messages(created_at DESC);

-- 5. COURSE ENROLLMENTS: Unindexed Foreign Key optimization
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id 
  ON public.course_enrollments(course_id);

-- 6. CERTIFICATES: Unindexed Foreign Key & Admin Listing
CREATE INDEX IF NOT EXISTS idx_certificates_course_id 
  ON public.certificates(course_id);

CREATE INDEX IF NOT EXISTS idx_certificates_created_at 
  ON public.certificates(created_at DESC);

-- 7. COURSE MODULES: Composite index for LMS & Course Learning
CREATE INDEX IF NOT EXISTS idx_course_modules_course_order 
  ON public.course_modules(course_id, order_index ASC);

-- 8. PORTFOLIO ITEMS: Composite index for Portfolio Showcase & Editor
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio_order 
  ON public.portfolio_items(portfolio_id, order_index ASC);

-- 9. LIBRARY ITEMS: Public resource library filtering and ordering
CREATE INDEX IF NOT EXISTS idx_library_items_published_created_at 
  ON public.library_items(published, created_at DESC);
```

---

## 8. Manual Production Execution Instructions

> [!IMPORTANT]
> In strict accordance with safety protocols, migrations are **never automatically executed against production**. You must review the SQL and apply it manually through the Supabase web dashboard.

### Steps to Apply in Supabase:
1. Open the [Supabase Dashboard](https://supabase.com/dashboard/project/fiirnhpsldouvnfvbtun).
2. Ensure you are on project `fiirnhpsldouvnfvbtun` (Region: `ap-south-1`).
3. In the left-hand navigation sidebar, click on **SQL Editor**.
4. Click **New query** (or press `Ctrl+N`).
5. Copy and paste the complete contents of `supabase/migrations/20260913_database_performance_indexes.sql`.
6. Click **Run** (or press `Ctrl+Enter`).
7. Verify that the output panel displays `Success. No rows returned`.

---

## 9. Local Verification Results

All local validation checks were executed successfully:

1. **TypeScript Typecheck**:
   - Command: `npx tsc --noEmit`
   - Result: `0 errors`
2. **Vitest Test Suite**:
   - Command: `npm test -- --run`
   - Result: `36/36 tests passed` (100% pass rate across 6 test files)
3. **Vite Production Build**:
   - Command: `npm run build`
   - Result: Successfully compiled production bundle to `dist/` with 0 warnings or errors.
