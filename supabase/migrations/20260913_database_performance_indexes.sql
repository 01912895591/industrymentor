-- Phase 8 Prompt 3: Database Performance, Index Audit & Query Optimization
-- IndustryMentor Production Database Performance Migration
-- Target Supabase Project: fiirnhpsldouvnfvbtun (ap-south-1)
-- Safe, idempotent index creation for high-frequency queries and unindexed foreign keys

-- ============================================================================
-- 1. COURSES: Public catalog filtering and reverse chronological ordering
-- Application queries:
--   - Courses.tsx: .eq('published', true).order('created_at', { ascending: false })
--   - Index.tsx: .eq('published', true).order('created_at', { ascending: false }).limit(6)
--   - RLS Policy: "Public can view published courses" USING (published = true)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_courses_published_created_at 
  ON public.courses(published, created_at DESC);

-- ============================================================================
-- 2. BLOGS: Public blog feed filtering and reverse chronological ordering
-- Application queries:
--   - Blog.tsx: .eq('published', true).order('created_at', { ascending: false })
--   - CTASection.tsx: .eq('published', true).order('created_at', { ascending: false }).limit(3)
--   - RLS Policy: "Public can view published blogs" USING (published = true)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_blogs_published_created_at 
  ON public.blogs(published, created_at DESC);

-- ============================================================================
-- 3. MENTORS: Public mentor showcase ordering
-- Application queries:
--   - Mentors.tsx: .order('created_at', { ascending: true })
--   - Index.tsx: .order('created_at', { ascending: true }).limit(8)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_mentors_created_at 
  ON public.mentors(created_at ASC);

-- ============================================================================
-- 4. MESSAGES: Admin inbox reverse chronological ordering
-- Application queries:
--   - Messages.tsx: .select('*').order('created_at', { ascending: false })
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
  ON public.messages(created_at DESC);

-- ============================================================================
-- 5. COURSE ENROLLMENTS: Unindexed Foreign Key optimization
-- Schema notes:
--   - UNIQUE(user_id, course_id) indexes user_id as leading column.
--   - course_id FK was unindexed, causing table scans during course deletions or course-wide queries.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id 
  ON public.course_enrollments(course_id);

-- ============================================================================
-- 6. CERTIFICATES: Unindexed Foreign Key & Admin Listing
-- Schema notes:
--   - UNIQUE(user_id, course_id) indexes user_id as leading column.
--   - UNIQUE(certificate_number) already indexes certificate_number.
--   - course_id FK was unindexed.
--   - Admin queries order by created_at DESC.
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_certificates_course_id 
  ON public.certificates(course_id);

CREATE INDEX IF NOT EXISTS idx_certificates_created_at 
  ON public.certificates(created_at DESC);

-- ============================================================================
-- 7. COURSE MODULES: Composite index for LMS & Course Learning
-- Application queries:
--   - CourseLearning.tsx, CourseDetail.tsx, CourseEnrollment.tsx, CourseModulesViewer.tsx:
--     .eq('course_id', courseId).order('order_index', { ascending: true })
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_course_modules_course_order 
  ON public.course_modules(course_id, order_index ASC);

-- ============================================================================
-- 8. PORTFOLIO ITEMS: Composite index for Portfolio Showcase & Editor
-- Application queries:
--   - PortfolioShowcase.tsx, PortfolioEditor.tsx:
--     .eq('portfolio_id', portfolioId).order('order_index', { ascending: true })
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio_order 
  ON public.portfolio_items(portfolio_id, order_index ASC);

-- ============================================================================
-- 9. LIBRARY ITEMS: Public resource library filtering and ordering
-- Application queries:
--   - Career.tsx, ResourceLibrarySection.tsx:
--     .eq('published', true).order('created_at', { ascending: false })
--   - RLS Policy: "Public can view published library items" USING (published = true)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_library_items_published_created_at 
  ON public.library_items(published, created_at DESC);
