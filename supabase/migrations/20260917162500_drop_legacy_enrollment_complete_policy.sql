-- ====================================================================
-- INDUSTRYMENTOR: REMOVE LEGACY ENROLLMENT UPDATE POLICY
-- Migration Version: 20260917162500_drop_legacy_enrollment_complete_policy
--
-- Security Objective:
-- Permanently remove the legacy insecure policy:
-- Users can mark their own enrollments as complete
-- on table public.course_enrollments.
-- ====================================================================

DROP POLICY IF EXISTS "Users can mark their own enrollments as complete" ON public.course_enrollments;
