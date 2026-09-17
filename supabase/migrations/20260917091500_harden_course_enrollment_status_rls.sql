-- ====================================================================
-- INDUSTRYMENTOR: HARDEN COURSE ENROLLMENT STATUS RLS
-- Migration Version: 20260917091500_harden_course_enrollment_status_rls
--
-- Security Objective:
-- Prevent authenticated students from inserting or self-promoting
-- enrollments with privileged states ('active', 'rejected', etc.).
--
-- Security Rules Enforced:
-- 1. Students can only INSERT enrollments for their own user_id (auth.uid() = user_id)
--    with status strictly set to 'pending' (status = 'pending').
-- 2. Students cannot insert enrollments with status = 'active' (bypassing payment)
--    or status = 'rejected' or any other state.
-- 3. Students cannot UPDATE enrollments (no self-activation or privilege escalation).
-- 4. Authorized Admins retain full CRUD privileges (SELECT, INSERT, UPDATE, DELETE).
-- ====================================================================

-- Ensure RLS is active on course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- 1. DROP UNSAFE OR LEGACY INSERT POLICIES
DROP POLICY IF EXISTS "Users can create their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can insert enrollments" ON public.course_enrollments;

-- 2. CREATE SECURE STUDENT INSERT POLICY (MANDATES STATUS = 'pending')
-- Ensures students can ONLY submit pending requests awaiting admin payment verification
CREATE POLICY "Users can insert their own enrollments"
ON public.course_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);

-- 3. ADMIN INSERT POLICY (Allows administrators to manually enroll students)
CREATE POLICY "Admins can insert enrollments"
ON public.course_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- 4. DEFENSIVE UPDATE SECURITY (Prevent student self-approval)
-- Drop any legacy or accidental student UPDATE policies
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can update enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can manage enrollments" ON public.course_enrollments;

-- Only verified administrators can UPDATE enrollments (approving/rejecting enrollments)
CREATE POLICY "Admins can manage enrollments"
ON public.course_enrollments
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. PRESERVE SELECT AND DELETE POLICIES
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can view all enrollments"
ON public.course_enrollments
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete enrollments" ON public.course_enrollments;
CREATE POLICY "Admins can delete enrollments"
ON public.course_enrollments
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
