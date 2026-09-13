# Phase 8 — Supabase Database Performance & Indexing Recommendations

**Document Status:** ADVISORY ONLY — NO SQL EXECUTED  
**Generated During:** Phase 8 Prompt 1 (SEO, Performance & Security Audit)  
**Applicable System:** IndustryMentor Supabase PostgreSQL  

---

## 1. Overview & Constraints

In strict accordance with Phase 8 Prompt 1 guidelines, **zero database migrations were executed and no SQL was run against the live Supabase instance**. 

During the query efficiency audit of the frontend application, several high-traffic query access patterns were identified across public catalogs, student workspaces, admin review dashboards, and public portfolio pages. This document outlines concrete index recommendations, composite index strategies, and query performance considerations for the engineering team to review and test in a staging environment before executing in production.

---

## 2. Table Query Access Patterns & Recommended Indexes

### 2.1 `public.courses`
* **Current Access Pattern:**
  * Public course directory (`/courses`): Queries `WHERE published = true ORDER BY created_at DESC`.
  * Featured courses on homepage (`/`): Queries `WHERE published = true ORDER BY created_at DESC LIMIT 6`.
  * Single course lookup (`/courses/:slug`): Queries `WHERE slug = :slug AND published = true LIMIT 1`.
* **Recommended Index:**
  ```sql
  -- Accelerates public courses catalog filtering and chronological ordering
  CREATE INDEX IF NOT EXISTS idx_courses_published_created_at 
  ON public.courses (published, created_at DESC);

  -- Accelerates slug lookup if not already covered by a unique constraint
  CREATE INDEX IF NOT EXISTS idx_courses_slug_published 
  ON public.courses (slug) WHERE published = true;
  ```

### 2.2 `public.blogs`
* **Current Access Pattern:**
  * Public blog directory (`/blog` or `/blogs`): Queries `WHERE published = true ORDER BY created_at DESC`.
  * Single blog post (`/blog/:slug`): Queries `WHERE slug = :slug LIMIT 1`.
* **Recommended Index:**
  ```sql
  -- Accelerates blog listing and ordering
  CREATE INDEX IF NOT EXISTS idx_blogs_published_created_at 
  ON public.blogs (published, created_at DESC);

  -- Partial index for slug lookup
  CREATE INDEX IF NOT EXISTS idx_blogs_slug_published 
  ON public.blogs (slug) WHERE published = true;
  ```

### 2.3 `public.project_submissions`
* **Current Access Pattern:**
  * Student workspace (`/projects/:slug/workspace`): Queries `WHERE project_id = :projectId AND user_id = auth.uid()`.
  * Admin submissions review (`/admin/project-submissions`): Queries `WHERE status = :status ORDER BY submitted_at DESC` or all submissions sorted by `submitted_at DESC`.
  * Student portfolio builder: Queries user's approved submissions `WHERE user_id = auth.uid() AND status = 'approved'`.
* **Recommended Index:**
  ```sql
  -- Accelerates student workspace submission lookup
  CREATE INDEX IF NOT EXISTS idx_project_submissions_user_project 
  ON public.project_submissions (user_id, project_id);

  -- Accelerates admin queue filtering by status and submission date
  CREATE INDEX IF NOT EXISTS idx_project_submissions_status_submitted_at 
  ON public.project_submissions (status, submitted_at DESC);

  -- Partial index for approved submissions (portfolio eligibility)
  CREATE INDEX IF NOT EXISTS idx_project_submissions_user_approved 
  ON public.project_submissions (user_id) 
  WHERE status = 'approved';
  ```

### 2.4 `public.portfolio_items`
* **Current Access Pattern:**
  * Public portfolio view (`/portfolio/:slug`): Queries items for the portfolio `WHERE portfolio_id = :portfolioId ORDER BY display_order ASC`.
  * Student portfolio editor (`/portfolio`): Queries items for reordering and deletion.
* **Recommended Index:**
  ```sql
  -- Accelerates ordered retrieval of portfolio items for both public and owner views
  CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio_order 
  ON public.portfolio_items (portfolio_id, display_order ASC);
  ```

### 2.5 `public.portfolios`
* **Current Access Pattern:**
  * Public portfolio lookup (`/portfolio/:slug`): Queries `WHERE slug = :slug LIMIT 1`.
  * Student portfolio owner check: Queries `WHERE user_id = auth.uid() LIMIT 1`.
* **Recommended Index:**
  ```sql
  -- Unique index on slug already exists; ensure user_id index exists for owner resolution
  CREATE INDEX IF NOT EXISTS idx_portfolios_user_id 
  ON public.portfolios (user_id);
  ```

### 2.6 `public.certificates`
* **Current Access Pattern:**
  * Public certificate verification (`/verify`): Calls `public.verify_certificate(:cert_number)`.
  * Student certificate listing (`/dashboard` & `/portfolio`): Queries `WHERE user_id = auth.uid() AND status = 'approved'`.
* **Recommended Index:**
  ```sql
  -- Accelerates certificate verification RPC lookup
  CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number_upper 
  ON public.certificates (UPPER(certificate_number));

  -- Accelerates student certificate retrieval
  CREATE INDEX IF NOT EXISTS idx_certificates_user_status 
  ON public.certificates (user_id, status);
  ```

---

## 3. Query Design Best Practices Applied in Frontend

During Phase 8 Prompt 1, frontend Supabase calls were hardened to avoid unbounded column fetching:
1. **Column Narrowing:** Replaced `supabase.from('courses').select('*')` with explicit column selections (`id, slug, title, description, cover_image, price, level, duration_hours, published, created_at, category`) in `Courses.tsx` and `FeaturedCoursesSection.tsx`.
2. **Mentors Catalog Narrowing:** Replaced `supabase.from('mentors').select('*')` with explicit profile and company columns in `MentorsSection.tsx`.
3. **Payload Reduction:** Eliminates transfer of large internal fields (such as comprehensive raw markdown curriculums or administrative logs) on listing and index views.

---

## 4. Staging Deployment Checklist

Before applying any index to production:
1. Run `EXPLAIN ANALYZE` on representative queries on a staging database with realistic data volumes.
2. Verify index builds complete without locking tables (`CREATE INDEX CONCURRENTLY` recommended for production tables with active write traffic).
3. Monitor query execution plans post-migration to ensure PostgreSQL query planner utilizes the new composite indexes.
