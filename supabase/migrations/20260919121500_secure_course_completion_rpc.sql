-- ====================================================================
-- INDUSTRYMENTOR: SECURE STUDENT COURSE COMPLETION RPC
-- Migration Version: 20260919121500_secure_course_completion_rpc
--
-- Security Objective:
-- Allow an authenticated student to mark ONLY their own ACTIVE course
-- enrollment as completed, without opening direct UPDATE permissions
-- on the public.course_enrollments table.
--
-- Security Guarantees:
-- 1. SECURITY DEFINER with search_path = public.
-- 2. Fully qualified table name public.course_enrollments.
-- 3. Execution strictly granted to 'authenticated' role; revoked from PUBLIC/anon.
-- 4. Rejects unauthenticated calls (auth.uid() IS NULL).
-- 5. Restricts update target to:
--    id = p_enrollment_id AND user_id = auth.uid() AND status = 'active'.
-- 6. Updates ONLY completed = true and updated_at = now().
-- 7. NEVER modifies status, course_id, user_id, or payment fields.
-- 8. Returns TRUE if row was updated, FALSE otherwise.
-- ====================================================================

-- Ensure updated_at column exists on course_enrollments
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create secure course completion function
CREATE OR REPLACE FUNCTION public.mark_course_complete(p_enrollment_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- 1. Verify authenticated caller exists
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- 2. Perform strictly constrained update on caller's own ACTIVE enrollment
  UPDATE public.course_enrollments
  SET
    completed = true,
    updated_at = now()
  WHERE id = p_enrollment_id
    AND user_id = v_user_id
    AND status = 'active';

  -- 3. Return TRUE if exactly the intended row was updated; FALSE if not found/unauthorized/not active
  RETURN FOUND;
END;
$$;

-- 4. Revoke all execution permissions from PUBLIC (including anon)
REVOKE ALL ON FUNCTION public.mark_course_complete(uuid) FROM PUBLIC;

-- 5. Grant execute permission strictly to authenticated users
GRANT EXECUTE ON FUNCTION public.mark_course_complete(uuid) TO authenticated;
