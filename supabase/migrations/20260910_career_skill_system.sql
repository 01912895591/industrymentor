-- ============================================================================
-- Migration: 20260910_career_skill_system.sql
-- Description: Phase 6 P0 Career Pathways & Skill System Database Foundation
-- Target Platform: IndustryMentor (https://industrymentor.net/)
-- Engine: PostgreSQL 15+ (Supabase) with Row Level Security (RLS)
-- Author: Senior Supabase Database Engineer & Full-Stack Architect
-- Hardening: Standardized difficulty enum, slug-based dynamic FK resolution,
--            transaction safety (BEGIN/COMMIT), and integrity verification block.
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. CREATE P0 TABLES
-- ============================================================================

-- 1.1 CAREER PATHWAYS
CREATE TABLE IF NOT EXISTS public.career_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    description TEXT NOT NULL,
    practical_scope TEXT,
    icon_name TEXT DEFAULT 'Briefcase',
    order_index INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT career_paths_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT career_paths_order_check CHECK (order_index >= 0)
);

-- 1.2 SKILLS INVENTORY (Standardized to single production difficulty vocabulary)
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    description TEXT NOT NULL,
    practical_application TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Foundational', 'Intermediate', 'Advanced')),
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT skills_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

-- 1.3 CAREER PATH <-> SKILLS JUNCTION (Ordered, Tiered, Core vs Elective)
CREATE TABLE IF NOT EXISTS public.career_path_skills (
    career_path_id UUID NOT NULL REFERENCES public.career_paths(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    is_core BOOLEAN NOT NULL DEFAULT true,
    stage_tier INT NOT NULL DEFAULT 1,
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (career_path_id, skill_id),
    CONSTRAINT career_path_skills_tier_check CHECK (stage_tier BETWEEN 1 AND 5),
    CONSTRAINT career_path_skills_order_check CHECK (order_index >= 0)
);

-- 1.4 SKILL <-> COURSES JUNCTION (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.skill_courses (
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (skill_id, course_id),
    CONSTRAINT skill_courses_order_check CHECK (order_index >= 0)
);

-- 1.5 SKILL <-> MENTORS JUNCTION (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.skill_mentors (
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    mentor_id UUID NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
    is_lead BOOLEAN NOT NULL DEFAULT false,
    specialization_note TEXT,
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (skill_id, mentor_id),
    CONSTRAINT skill_mentors_order_check CHECK (order_index >= 0)
);

-- 1.6 SKILL <-> LIBRARY ITEMS JUNCTION (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.skill_library_items (
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
    resource_role TEXT CHECK (resource_role IS NULL OR resource_role IN ('handbook', 'calculation_tool', 'reference_guide', 'sop_template')),
    order_index INT NOT NULL DEFAULT 0,
    PRIMARY KEY (skill_id, library_item_id),
    CONSTRAINT skill_library_items_order_check CHECK (order_index >= 0)
);

-- ============================================================================
-- 2. CREATE INDEXES FOR FAST POSTGREST QUERY EXECUTION
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_career_paths_slug ON public.career_paths(slug);
CREATE INDEX IF NOT EXISTS idx_career_paths_published ON public.career_paths(is_published, order_index);
CREATE INDEX IF NOT EXISTS idx_skills_slug ON public.skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_domain ON public.skills(domain);
CREATE INDEX IF NOT EXISTS idx_skills_published ON public.skills(is_published);
CREATE INDEX IF NOT EXISTS idx_career_path_skills_skill ON public.career_path_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_career_path_skills_order ON public.career_path_skills(order_index);
CREATE INDEX IF NOT EXISTS idx_skill_courses_course ON public.skill_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_skill_mentors_mentor ON public.skill_mentors(mentor_id);
CREATE INDEX IF NOT EXISTS idx_skill_library_items_library ON public.skill_library_items(library_item_id);

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all 6 tables
ALTER TABLE public.career_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.career_path_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_library_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running migration to avoid conflict
DO $$
BEGIN
    -- career_paths
    DROP POLICY IF EXISTS "Public can view published career paths" ON public.career_paths;
    DROP POLICY IF EXISTS "Admins have full access to career paths" ON public.career_paths;

    -- skills
    DROP POLICY IF EXISTS "Public can view published skills" ON public.skills;
    DROP POLICY IF EXISTS "Admins have full access to skills" ON public.skills;

    -- career_path_skills
    DROP POLICY IF EXISTS "Public can view career path skills" ON public.career_path_skills;
    DROP POLICY IF EXISTS "Admins have full access to career path skills" ON public.career_path_skills;

    -- skill_courses
    DROP POLICY IF EXISTS "Public can view skill courses" ON public.skill_courses;
    DROP POLICY IF EXISTS "Admins have full access to skill courses" ON public.skill_courses;

    -- skill_mentors
    DROP POLICY IF EXISTS "Public can view skill mentors" ON public.skill_mentors;
    DROP POLICY IF EXISTS "Admins have full access to skill mentors" ON public.skill_mentors;

    -- skill_library_items
    DROP POLICY IF EXISTS "Public can view skill library items" ON public.skill_library_items;
    DROP POLICY IF EXISTS "Admins have full access to skill library items" ON public.skill_library_items;
END
$$;

-- 3.1 PUBLIC READ ACCESS (Published catalog & public junctions)
CREATE POLICY "Public can view published career paths"
    ON public.career_paths FOR SELECT
    USING (is_published = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Public can view published skills"
    ON public.skills FOR SELECT
    USING (is_published = true OR (auth.uid() IS NOT NULL AND public.has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Public can view career path skills"
    ON public.career_path_skills FOR SELECT
    USING (true);

CREATE POLICY "Public can view skill courses"
    ON public.skill_courses FOR SELECT
    USING (true);

CREATE POLICY "Public can view skill mentors"
    ON public.skill_mentors FOR SELECT
    USING (true);

CREATE POLICY "Public can view skill library items"
    ON public.skill_library_items FOR SELECT
    USING (true);

-- 3.2 ADMIN FULL CRUD ACCESS (Enforcing public.has_role pattern)
CREATE POLICY "Admins have full access to career paths"
    ON public.career_paths FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins have full access to skills"
    ON public.skills FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins have full access to career path skills"
    ON public.career_path_skills FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins have full access to skill courses"
    ON public.skill_courses FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins have full access to skill mentors"
    ON public.skill_mentors FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins have full access to skill library items"
    ON public.skill_library_items FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 4. SEED VERIFIED REAL DATA (IDEMPOTENT & SLUG-RESOLVED FOREIGN KEYS)
-- ============================================================================

-- 4.1 SEED CAREER PATHWAYS (3 Authentic Industrial Tracks)
INSERT INTO public.career_paths (slug, title, domain, description, practical_scope, icon_name, order_index, is_published)
VALUES
(
    'garment-merchandising-supply-execution',
    'Garment Merchandising & Supply Execution',
    'Merchandising',
    'Master end-to-end apparel merchandising from initial buyer tech-pack inquiry to critical order-to-shipment delivery.',
    'TNA calendar management, consumption calculations, buyer correspondence, sample approval follow-up, and production scheduling.',
    'Briefcase',
    1,
    true
),
(
    'industrial-engineering-production-systems',
    'Industrial Engineering & Production Systems',
    'Industrial Engineering',
    'Lead high-efficiency sewing lines, balance operational bottlenecks, and implement data-driven production optimization.',
    'Standard Minute Value (SMV) studies, method analysis, Lean 5S implementation, Kaizen line balancing, and automated Excel reporting.',
    'Factory',
    2,
    true
),
(
    'garment-quality-assurance-factory-compliance',
    'Garment Quality Assurance & Factory Compliance',
    'Quality Assurance',
    'Transition from reactive defect inspection into proactive, systemic defect prevention and international buyer compliance.',
    'Inline and endline audit protocols, AQL sampling inspection standards, root cause defect analysis, and factory SOP governance.',
    'ShieldCheck',
    3,
    true
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    domain = EXCLUDED.domain,
    description = EXCLUDED.description,
    practical_scope = EXCLUDED.practical_scope,
    icon_name = EXCLUDED.icon_name,
    order_index = EXCLUDED.order_index,
    is_published = EXCLUDED.is_published,
    updated_at = now();

-- 4.2 SEED VERIFIED SKILLS (9 Authentic Competencies with standardized difficulty)
INSERT INTO public.skills (slug, title, domain, description, practical_application, difficulty, is_published)
VALUES
(
    'order-to-shipment-execution-tna',
    'Order-to-Shipment Execution & TNA',
    'Merchandising',
    'Master critical path Time & Action calendars from order booking to final shipment inspection.',
    'Building Excel critical path trackers, buffer date calculations, and production follow-ups.',
    'Intermediate',
    true
),
(
    'buyer-negotiation-costing-breakdown',
    'Buyer Negotiation & Costing Breakdown',
    'Merchandising',
    'Professional buyer correspondence, discrepancy handling, fabric consumption, and CM pricing.',
    'Managing factory-to-buyer emails, tech-pack discrepancy logs, trim approval sheets, and costing sheets.',
    'Foundational',
    true
),
(
    'lean-six-sigma-kaizen-workflows',
    'Lean Six Sigma & Kaizen Workflows (LSSBB)',
    'Industrial Engineering',
    'Eliminating Muda (waste), 5S visual management, Kanban material replenishment, and Kaizen improvement cycles.',
    'Designing factory floor 5S visual zones, Spaghetti diagrams, and value stream maps.',
    'Advanced',
    true
),
(
    'smv-line-balancing',
    'Standard Minute Value (SMV) & Line Balancing',
    'Industrial Engineering',
    'Synthesizing standard minute values, cycle timing, operator allowances, and sewing balancing pitch.',
    'Conducting stop-watch time studies, calculating pitch times, and re-allocating operators.',
    'Advanced',
    true
),
(
    'advanced-excel-production-analytics',
    'Advanced Excel Production Analytics',
    'Industrial Engineering',
    'Dynamic operational dashboards, automated pivot reports, and KPI trackers for factory floor data.',
    'Constructing automated hourly production trackers, efficiency formulas, and DHU sheets.',
    'Intermediate',
    true
),
(
    '3d-drawing-technical-layouts',
    '3D Drawing & Technical Layouts',
    'Industrial Engineering',
    'Computer-aided machinery layouts, workstation ergonomics, and 3D simulation of sewing floor pathways.',
    'Drafting modular workstation arrangements and ergonomic operator seating plans in 3D.',
    'Foundational',
    true
),
(
    'executive-kpi-thinking-ai-tools',
    'Executive KPI Thinking & AI Tools',
    'Industrial Engineering',
    'Strategic manufacturing management, executive decision making, and modern AI tools for production monitoring.',
    'Formulating plant-wide executive KPI scorecards and using generative AI for operational SOP synthesis.',
    'Advanced',
    true
),
(
    'defect-elimination-aql-inspection',
    'Defect Elimination & AQL Inspection Protocols',
    'Quality Assurance',
    'Applying ISO 2859-1 / ANSI/ASQ Z1.4 sampling tables for normal, tightened, and reduced audits.',
    'Executing batch lot size calculations, critical/major/minor defect allowances, and pass/fail verdicts.',
    'Intermediate',
    true
),
(
    'factory-floor-quality-sop-governance',
    'Factory Floor Quality SOP Governance',
    'Quality Assurance',
    'Implementing 7-0 inspection systems, traffic light flags, roving audits, and root cause CAPA governance.',
    'Performing roving inline checks, identifying needle-cut defects, and drafting buyer CAPA plans.',
    'Foundational',
    true
)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    domain = EXCLUDED.domain,
    description = EXCLUDED.description,
    practical_application = EXCLUDED.practical_application,
    difficulty = EXCLUDED.difficulty,
    is_published = EXCLUDED.is_published,
    updated_at = now();

-- 4.3 SEED CAREER PATH <-> SKILLS JUNCTION (Resolved dynamically via unique slugs)
-- Pathway 1: Merchandising
INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 1, 1
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'garment-merchandising-supply-execution'
  AND s.slug = 'order-to-shipment-execution-tna'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 1, 2
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'garment-merchandising-supply-execution'
  AND s.slug = 'buyer-negotiation-costing-breakdown'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

-- Pathway 2: Industrial Engineering
INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 1, 1
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'industrial-engineering-production-systems'
  AND s.slug = 'lean-six-sigma-kaizen-workflows'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 1, 2
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'industrial-engineering-production-systems'
  AND s.slug = 'smv-line-balancing'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 2, 3
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'industrial-engineering-production-systems'
  AND s.slug = 'advanced-excel-production-analytics'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, false, 2, 4
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'industrial-engineering-production-systems'
  AND s.slug = '3d-drawing-technical-layouts'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 3, 5
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'industrial-engineering-production-systems'
  AND s.slug = 'executive-kpi-thinking-ai-tools'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

-- Pathway 3: Quality Assurance
INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 1, 1
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'garment-quality-assurance-factory-compliance'
  AND s.slug = 'defect-elimination-aql-inspection'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

INSERT INTO public.career_path_skills (career_path_id, skill_id, is_core, stage_tier, order_index)
SELECT cp.id, s.id, true, 2, 2
FROM public.career_paths cp, public.skills s
WHERE cp.slug = 'garment-quality-assurance-factory-compliance'
  AND s.slug = 'factory-floor-quality-sop-governance'
ON CONFLICT (career_path_id, skill_id) DO UPDATE SET
    is_core = EXCLUDED.is_core,
    stage_tier = EXCLUDED.stage_tier,
    order_index = EXCLUDED.order_index;

-- 4.4 SEED SKILL <-> COURSES (Resolved dynamically via unique skill slug + verified Course UUIDs)
-- Course 1: e373dcce-54fb-4a55-8070-54543691fedb (Garments Merchandising)
INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, 'e373dcce-54fb-4a55-8070-54543691fedb', true, 1
FROM public.skills s
WHERE s.slug = 'order-to-shipment-execution-tna'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, 'e373dcce-54fb-4a55-8070-54543691fedb', true, 2
FROM public.skills s
WHERE s.slug = 'buyer-negotiation-costing-breakdown'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

-- Course 2: 6c926dde-3139-475b-88b1-4bed05f69dda (Certified Elite-Performing Executive)
INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, '6c926dde-3139-475b-88b1-4bed05f69dda', false, 1
FROM public.skills s
WHERE s.slug = 'lean-six-sigma-kaizen-workflows'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, '6c926dde-3139-475b-88b1-4bed05f69dda', true, 2
FROM public.skills s
WHERE s.slug = 'advanced-excel-production-analytics'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, '6c926dde-3139-475b-88b1-4bed05f69dda', true, 3
FROM public.skills s
WHERE s.slug = 'executive-kpi-thinking-ai-tools'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

-- Course 3: 4cde3695-c539-465e-830b-48eed5e46a36 (Industrial Garment Quality Certification Course)
INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, '4cde3695-c539-465e-830b-48eed5e46a36', true, 1
FROM public.skills s
WHERE s.slug = 'defect-elimination-aql-inspection'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_courses (skill_id, course_id, is_primary, order_index)
SELECT s.id, '4cde3695-c539-465e-830b-48eed5e46a36', true, 2
FROM public.skills s
WHERE s.slug = 'factory-floor-quality-sop-governance'
ON CONFLICT (skill_id, course_id) DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    order_index = EXCLUDED.order_index;

-- 4.5 SEED SKILL <-> MENTORS (Resolved dynamically via unique skill slug + verified Mentor UUIDs)
-- Mentor 1: f10828d2-3877-4c2f-a94b-130f39a75df1 (M A QAIYUM TALUKDER)
INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, 'f10828d2-3877-4c2f-a94b-130f39a75df1', true, 'Order Execution & SCM Strategy', 1
FROM public.skills s
WHERE s.slug = 'order-to-shipment-execution-tna'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, 'f10828d2-3877-4c2f-a94b-130f39a75df1', true, 'Certified Lean Six Sigma Black Belt (LSSBB)', 2
FROM public.skills s
WHERE s.slug = 'lean-six-sigma-kaizen-workflows'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, 'f10828d2-3877-4c2f-a94b-130f39a75df1', true, 'AI Tools & Executive KPI Architecture', 3
FROM public.skills s
WHERE s.slug = 'executive-kpi-thinking-ai-tools'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

-- Mentor 2: a09cabea-b9e2-4b19-8f33-3fe793f20cf8 (Engr. Mehedi Hasan)
INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, 'a09cabea-b9e2-4b19-8f33-3fe793f20cf8', true, 'SMV Time Study & Method Optimization', 1
FROM public.skills s
WHERE s.slug = 'smv-line-balancing'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, 'a09cabea-b9e2-4b19-8f33-3fe793f20cf8', true, 'Excel Production Trackers & Analytics', 2
FROM public.skills s
WHERE s.slug = 'advanced-excel-production-analytics'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, 'a09cabea-b9e2-4b19-8f33-3fe793f20cf8', true, '3D Workstation Layout & Drawing', 3
FROM public.skills s
WHERE s.slug = '3d-drawing-technical-layouts'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

-- Mentor 3: 9e5c8522-0e03-46e9-8056-96b5358b40f9 (Mrs Meng)
INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, '9e5c8522-0e03-46e9-8056-96b5358b40f9', true, 'AQL Standards & International Defect Containment', 1
FROM public.skills s
WHERE s.slug = 'defect-elimination-aql-inspection'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_mentors (skill_id, mentor_id, is_lead, specialization_note, order_index)
SELECT s.id, '9e5c8522-0e03-46e9-8056-96b5358b40f9', true, 'Quality Audit Systems & CAPA Governance', 2
FROM public.skills s
WHERE s.slug = 'factory-floor-quality-sop-governance'
ON CONFLICT (skill_id, mentor_id) DO UPDATE SET
    is_lead = EXCLUDED.is_lead,
    specialization_note = EXCLUDED.specialization_note,
    order_index = EXCLUDED.order_index;

-- 4.6 SEED SKILL <-> LIBRARY ITEMS (Resolved dynamically via unique skill slug + verified Library Item UUIDs)
-- Library 1: 713a6bd9-0ded-45d4-ad32-2734b7af6f78 (Lean six sigma)
INSERT INTO public.skill_library_items (skill_id, library_item_id, resource_role, order_index)
SELECT s.id, '713a6bd9-0ded-45d4-ad32-2734b7af6f78', 'handbook', 1
FROM public.skills s
WHERE s.slug = 'lean-six-sigma-kaizen-workflows'
ON CONFLICT (skill_id, library_item_id) DO UPDATE SET
    resource_role = EXCLUDED.resource_role,
    order_index = EXCLUDED.order_index;

-- Library 2: 96cdaeb7-e268-41fb-aa03-9eb7bb834eee (KAIZEN METHODS)
INSERT INTO public.skill_library_items (skill_id, library_item_id, resource_role, order_index)
SELECT s.id, '96cdaeb7-e268-41fb-aa03-9eb7bb834eee', 'handbook', 2
FROM public.skills s
WHERE s.slug = 'lean-six-sigma-kaizen-workflows'
ON CONFLICT (skill_id, library_item_id) DO UPDATE SET
    resource_role = EXCLUDED.resource_role,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_library_items (skill_id, library_item_id, resource_role, order_index)
SELECT s.id, '96cdaeb7-e268-41fb-aa03-9eb7bb834eee', 'calculation_tool', 1
FROM public.skills s
WHERE s.slug = 'smv-line-balancing'
ON CONFLICT (skill_id, library_item_id) DO UPDATE SET
    resource_role = EXCLUDED.resource_role,
    order_index = EXCLUDED.order_index;

-- Library 3: f3696cd3-14b8-45db-a556-32332359e99e (The Essentials of Supply Chain Management)
INSERT INTO public.skill_library_items (skill_id, library_item_id, resource_role, order_index)
SELECT s.id, 'f3696cd3-14b8-45db-a556-32332359e99e', 'reference_guide', 1
FROM public.skills s
WHERE s.slug = 'order-to-shipment-execution-tna'
ON CONFLICT (skill_id, library_item_id) DO UPDATE SET
    resource_role = EXCLUDED.resource_role,
    order_index = EXCLUDED.order_index;

INSERT INTO public.skill_library_items (skill_id, library_item_id, resource_role, order_index)
SELECT s.id, 'f3696cd3-14b8-45db-a556-32332359e99e', 'reference_guide', 2
FROM public.skills s
WHERE s.slug = 'buyer-negotiation-costing-breakdown'
ON CONFLICT (skill_id, library_item_id) DO UPDATE SET
    resource_role = EXCLUDED.resource_role,
    order_index = EXCLUDED.order_index;

-- ============================================================================
-- 5. MIGRATION VERIFICATION & INTEGRITY CHECK
-- ============================================================================
DO $$
DECLARE
    v_paths_count INT;
    v_skills_count INT;
    v_path_skills_count INT;
    v_courses_count INT;
    v_mentors_count INT;
    v_library_count INT;
BEGIN
    SELECT count(*) INTO v_paths_count FROM public.career_paths;
    SELECT count(*) INTO v_skills_count FROM public.skills;
    SELECT count(*) INTO v_path_skills_count FROM public.career_path_skills;
    SELECT count(*) INTO v_courses_count FROM public.skill_courses;
    SELECT count(*) INTO v_mentors_count FROM public.skill_mentors;
    SELECT count(*) INTO v_library_count FROM public.skill_library_items;

    RAISE NOTICE 'Phase 6 Migration Completed Successfully:';
    RAISE NOTICE '  - Career Paths count: %', v_paths_count;
    RAISE NOTICE '  - Skills count: %', v_skills_count;
    RAISE NOTICE '  - Career Path Skills count: %', v_path_skills_count;
    RAISE NOTICE '  - Skill Courses count: %', v_courses_count;
    RAISE NOTICE '  - Skill Mentors count: %', v_mentors_count;
    RAISE NOTICE '  - Skill Library Items count: %', v_library_count;
END
$$;

COMMIT;
