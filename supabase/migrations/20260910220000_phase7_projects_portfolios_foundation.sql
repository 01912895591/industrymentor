-- ====================================================================
-- INDUSTRYMENTOR: PHASE 7 — PROJECTS, PORTFOLIO & SUBMISSION FOUNDATION
-- Migration Version: 20260910220000_phase7_projects_portfolios_foundation.sql
-- Description: Purely additive, non-destructive schema creation for:
--   1. public.projects
--   2. public.project_career_paths
--   3. public.project_skills
--   4. public.project_submissions
--   5. public.portfolios
--   6. public.portfolio_items
-- Zero modifications to existing tables (certificates untouched).
-- Zero fake seed data.
-- Security Hardened: Source verification on INSERT/UPDATE & public SELECT.
-- ====================================================================

BEGIN;

-- ====================================================================
-- 1. CREATE CORE TABLES
-- ====================================================================

-- 1.1 Master Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  short_description text NOT NULL,
  detailed_brief text,
  domain text,
  difficulty text CHECK (difficulty IS NULL OR difficulty IN ('Foundational', 'Intermediate', 'Advanced')),
  estimated_hours integer CHECK (estimated_hours IS NULL OR estimated_hours >= 0),
  learning_objectives jsonb DEFAULT '[]'::jsonb,
  deliverables jsonb DEFAULT '[]'::jsonb,
  evaluation_criteria jsonb DEFAULT '[]'::jsonb,
  instructions text,
  resources jsonb DEFAULT '[]'::jsonb,
  mentor_guidance text,
  is_published boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT projects_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 3 AND length(slug) <= 100)
);

-- 1.2 Project <-> Career Path Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.project_career_paths (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  career_path_id uuid NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  PRIMARY KEY (project_id, career_path_id)
);

-- 1.3 Project <-> Skill Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.project_skills (
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  PRIMARY KEY (project_id, skill_id)
);

-- 1.4 Student Project Submissions
CREATE TABLE IF NOT EXISTS public.project_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  submission_notes text,
  deliverable_url text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'in_review', 'approved', 'revision_required')),
  admin_feedback text,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_student_project_submission UNIQUE (project_id, user_id),
  CONSTRAINT valid_deliverable_url CHECK (
    deliverable_url IS NULL OR (
      deliverable_url ~* '^https?://[^[:space:]]+$' 
      AND deliverable_url !~* '^(javascript|data|file):'
    )
  )
);

-- 1.5 Student Professional Portfolios
CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  headline text,
  bio text,
  career_path_id uuid REFERENCES public.career_paths(id) ON DELETE SET NULL,
  location text,
  linkedin_url text,
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT portfolios_slug_format CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) >= 3 AND length(slug) <= 60),
  CONSTRAINT valid_linkedin_url CHECK (
    linkedin_url IS NULL OR (
      linkedin_url ~* '^https?://[^[:space:]]+$' 
      AND linkedin_url !~* '^(javascript|data|file):'
    )
  )
);

-- 1.6 Portfolio Showcase Items
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  project_submission_id uuid REFERENCES public.project_submissions(id) ON DELETE CASCADE,
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE,
  is_featured boolean NOT NULL DEFAULT false,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Must reference exactly one source: either a project submission OR a certificate
  CONSTRAINT portfolio_items_exactly_one_source CHECK (
    (project_submission_id IS NOT NULL AND certificate_id IS NULL) OR
    (project_submission_id IS NULL AND certificate_id IS NOT NULL)
  ),
  CONSTRAINT unique_portfolio_item_submission UNIQUE (portfolio_id, project_submission_id),
  CONSTRAINT unique_portfolio_item_certificate UNIQUE (portfolio_id, certificate_id)
);

-- ====================================================================
-- 2. AUTOMATIC UPDATED_AT TRIGGERS
-- ====================================================================
-- Reuses existing public.update_updated_at_column()

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_project_submissions_updated_at ON public.project_submissions;
CREATE TRIGGER trg_project_submissions_updated_at
BEFORE UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_portfolios_updated_at ON public.portfolios;
CREATE TRIGGER trg_portfolios_updated_at
BEFORE UPDATE ON public.portfolios
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ====================================================================
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================

-- 3.1 Projects Indexes
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON public.projects(is_published);
CREATE INDEX IF NOT EXISTS idx_projects_order_index ON public.projects(order_index);
CREATE INDEX IF NOT EXISTS idx_projects_domain ON public.projects(domain);
CREATE INDEX IF NOT EXISTS idx_projects_difficulty ON public.projects(difficulty);

-- 3.2 Junction Indexes
CREATE INDEX IF NOT EXISTS idx_project_career_paths_career_path_id ON public.project_career_paths(career_path_id);
CREATE INDEX IF NOT EXISTS idx_project_career_paths_order ON public.project_career_paths(order_index);
CREATE INDEX IF NOT EXISTS idx_project_skills_skill_id ON public.project_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_project_skills_is_primary ON public.project_skills(is_primary);
CREATE INDEX IF NOT EXISTS idx_project_skills_order ON public.project_skills(order_index);

-- 3.3 Submissions Indexes
CREATE INDEX IF NOT EXISTS idx_project_submissions_project_id ON public.project_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_user_id ON public.project_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_status ON public.project_submissions(status);
CREATE INDEX IF NOT EXISTS idx_project_submissions_submitted_at ON public.project_submissions(submitted_at DESC);

-- 3.4 Portfolios Indexes
CREATE INDEX IF NOT EXISTS idx_portfolios_slug ON public.portfolios(slug);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_is_public ON public.portfolios(is_public);
CREATE INDEX IF NOT EXISTS idx_portfolios_career_path_id ON public.portfolios(career_path_id);

-- 3.5 Portfolio Items Indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio_id ON public.portfolio_items(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_submission_id ON public.portfolio_items(project_submission_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_certificate_id ON public.portfolio_items(certificate_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_order ON public.portfolio_items(order_index);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_featured ON public.portfolio_items(is_featured);

-- ====================================================================
-- 4. RECURSION-SAFE HELPER FUNCTIONS FOR RLS
-- ====================================================================

-- 4.1 Check if an approved project submission is publicly featured on an active public portfolio
CREATE OR REPLACE FUNCTION public.is_submission_public(sub_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

GRANT EXECUTE ON FUNCTION public.is_submission_public(uuid) TO anon, authenticated;

-- 4.2 Check if a portfolio item is publicly viewable (parent portfolio is public AND source artifact is approved and owned by portfolio owner)
CREATE OR REPLACE FUNCTION public.is_portfolio_item_public(item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.portfolio_items pi
    JOIN public.portfolios p ON p.id = pi.portfolio_id
    LEFT JOIN public.project_submissions ps ON ps.id = pi.project_submission_id
    LEFT JOIN public.certificates c ON c.id = pi.certificate_id
    WHERE pi.id = item_id
      AND p.is_public = true
      AND (
        (pi.project_submission_id IS NOT NULL AND ps.user_id = p.user_id AND ps.status = 'approved')
        OR
        (pi.certificate_id IS NOT NULL AND c.user_id = p.user_id AND c.status = 'approved')
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_portfolio_item_public(uuid) TO anon, authenticated;

-- ====================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- 5.1 Enable RLS on all 6 tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- 5.2 public.projects Policies
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
CREATE POLICY "Public can view published projects"
ON public.projects FOR SELECT
USING (
  is_published = true 
  OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
);

DROP POLICY IF EXISTS "Admins can manage projects" ON public.projects;
CREATE POLICY "Admins can manage projects"
ON public.projects FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- --------------------------------------------------------------------
-- 5.3 public.project_career_paths Policies
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view career path mappings for published projects" ON public.project_career_paths;
CREATE POLICY "Public can view career path mappings for published projects"
ON public.project_career_paths FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_career_paths.project_id
      AND (p.is_published = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role)))
  )
);

DROP POLICY IF EXISTS "Admins can manage project career paths" ON public.project_career_paths;
CREATE POLICY "Admins can manage project career paths"
ON public.project_career_paths FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- --------------------------------------------------------------------
-- 5.4 public.project_skills Policies
-- --------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view skill mappings for published projects" ON public.project_skills;
CREATE POLICY "Public can view skill mappings for published projects"
ON public.project_skills FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_skills.project_id
      AND (p.is_published = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role)))
  )
);

DROP POLICY IF EXISTS "Admins can manage project skills" ON public.project_skills;
CREATE POLICY "Admins can manage project skills"
ON public.project_skills FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- --------------------------------------------------------------------
-- 5.5 public.project_submissions Policies
-- --------------------------------------------------------------------
-- Owner can view own submission
DROP POLICY IF EXISTS "Users can view own project submissions" ON public.project_submissions;
CREATE POLICY "Users can view own project submissions"
ON public.project_submissions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Public can view approved submissions featured on public portfolios (via recursion-safe function)
DROP POLICY IF EXISTS "Public can view approved submissions on public portfolios" ON public.project_submissions;
CREATE POLICY "Public can view approved submissions on public portfolios"
ON public.project_submissions FOR SELECT
USING (status = 'approved' AND public.is_submission_public(id));

-- Students can insert own submission; status is restricted to 'submitted'
DROP POLICY IF EXISTS "Users can insert own project submissions" ON public.project_submissions;
CREATE POLICY "Users can insert own project submissions"
ON public.project_submissions FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'submitted'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND admin_feedback IS NULL
);

-- Students can update own submission ONLY when submitted or revision_required; cannot tamper with review fields
DROP POLICY IF EXISTS "Users can update own project submissions" ON public.project_submissions;
CREATE POLICY "Users can update own project submissions"
ON public.project_submissions FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  AND status IN ('submitted', 'revision_required')
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'submitted'
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND admin_feedback IS NULL
);

-- Admins have full management access (review, approve, feedback, status transitions)
DROP POLICY IF EXISTS "Admins can manage all project submissions" ON public.project_submissions;
CREATE POLICY "Admins can manage all project submissions"
ON public.project_submissions FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- --------------------------------------------------------------------
-- 5.6 public.portfolios Policies
-- --------------------------------------------------------------------
-- Public visitors can view portfolios marked public; owners and admins can view any
DROP POLICY IF EXISTS "Public can view public portfolios" ON public.portfolios;
CREATE POLICY "Public can view public portfolios"
ON public.portfolios FOR SELECT
USING (
  is_public = true 
  OR auth.uid() = user_id 
  OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::public.app_role))
);

-- Users can create their own single portfolio
DROP POLICY IF EXISTS "Users can insert own portfolio" ON public.portfolios;
CREATE POLICY "Users can insert own portfolio"
ON public.portfolios FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own portfolio
DROP POLICY IF EXISTS "Users can update own portfolio" ON public.portfolios;
CREATE POLICY "Users can update own portfolio"
ON public.portfolios FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own portfolio
DROP POLICY IF EXISTS "Users can delete own portfolio" ON public.portfolios;
CREATE POLICY "Users can delete own portfolio"
ON public.portfolios FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admins can manage all portfolios
DROP POLICY IF EXISTS "Admins can manage all portfolios" ON public.portfolios;
CREATE POLICY "Admins can manage all portfolios"
ON public.portfolios FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- --------------------------------------------------------------------
-- 5.7 public.portfolio_items Policies
-- --------------------------------------------------------------------
-- Public can view items ONLY if parent portfolio is public AND referenced source is approved & owned by portfolio owner
DROP POLICY IF EXISTS "Public can view items of public portfolios" ON public.portfolio_items;
DROP POLICY IF EXISTS "Public can view valid items of public portfolios" ON public.portfolio_items;
CREATE POLICY "Public can view valid items of public portfolios"
ON public.portfolio_items FOR SELECT
USING (
  public.is_portfolio_item_public(id)
  OR (
    auth.uid() IS NOT NULL AND (
      EXISTS (
        SELECT 1 FROM public.portfolios p
        WHERE p.id = portfolio_items.portfolio_id
          AND p.user_id = auth.uid()
      )
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
    )
  )
);

-- Users can insert items into their own portfolio ONLY for their OWN APPROVED submissions and certificates
DROP POLICY IF EXISTS "Users can insert own portfolio items" ON public.portfolio_items;
CREATE POLICY "Users can insert own portfolio items"
ON public.portfolio_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portfolios p
    WHERE p.id = portfolio_items.portfolio_id
      AND p.user_id = auth.uid()
  )
  AND (
    project_submission_id IS NULL OR EXISTS (
      SELECT 1 FROM public.project_submissions ps
      WHERE ps.id = portfolio_items.project_submission_id
        AND ps.user_id = auth.uid()
        AND ps.status = 'approved'
    )
  )
  AND (
    certificate_id IS NULL OR EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.id = portfolio_items.certificate_id
        AND c.user_id = auth.uid()
        AND c.status = 'approved'
    )
  )
);

-- Users can update items in their own portfolio ONLY to their OWN APPROVED submissions and certificates
DROP POLICY IF EXISTS "Users can update own portfolio items" ON public.portfolio_items;
CREATE POLICY "Users can update own portfolio items"
ON public.portfolio_items FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios p
    WHERE p.id = portfolio_items.portfolio_id
      AND p.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portfolios p
    WHERE p.id = portfolio_items.portfolio_id
      AND p.user_id = auth.uid()
  )
  AND (
    project_submission_id IS NULL OR EXISTS (
      SELECT 1 FROM public.project_submissions ps
      WHERE ps.id = portfolio_items.project_submission_id
        AND ps.user_id = auth.uid()
        AND ps.status = 'approved'
    )
  )
  AND (
    certificate_id IS NULL OR EXISTS (
      SELECT 1 FROM public.certificates c
      WHERE c.id = portfolio_items.certificate_id
        AND c.user_id = auth.uid()
        AND c.status = 'approved'
    )
  )
);

-- Users can delete items from their own portfolio
DROP POLICY IF EXISTS "Users can delete own portfolio items" ON public.portfolio_items;
CREATE POLICY "Users can delete own portfolio items"
ON public.portfolio_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios p
    WHERE p.id = portfolio_items.portfolio_id
      AND p.user_id = auth.uid()
  )
);

-- Admins can manage all portfolio items
DROP POLICY IF EXISTS "Admins can manage all portfolio items" ON public.portfolio_items;
CREATE POLICY "Admins can manage all portfolio items"
ON public.portfolio_items FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

COMMIT;
