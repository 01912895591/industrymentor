-- Migration: 20260930160000_telegram_course_rejection_rpc.sql
-- Description: Create atomic RPC function for rejecting course enrollments via Telegram / Admin

CREATE OR REPLACE FUNCTION public.reject_enrollment_by_id(p_enrollment_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment record;
BEGIN
  -- 1. Fetch pending enrollment record
  SELECT e.*, c.title as course_title, p.email as user_email
  INTO v_enrollment
  FROM public.course_enrollments e
  LEFT JOIN public.courses c ON c.id = e.course_id
  LEFT JOIN public.profiles p ON p.user_id = e.user_id
  WHERE e.id = p_enrollment_id;

  IF v_enrollment.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Enrollment record not found');
  END IF;

  -- 2. Update course_enrollments to rejected
  UPDATE public.course_enrollments
  SET status = 'rejected', updated_at = NOW()
  WHERE id = p_enrollment_id;

  -- 3. Update associated purchase record if present
  IF v_enrollment.purchase_id IS NOT NULL THEN
    UPDATE public.purchases
    SET status = 'rejected'
    WHERE id = v_enrollment.purchase_id;
  END IF;

  -- 4. Create in-app system notification for student
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type
  ) VALUES (
    v_enrollment.user_id,
    'Enrollment Update ⚠️',
    CONCAT('Your payment verification for "', COALESCE(v_enrollment.course_title, 'your course'), '" could not be confirmed. Please check your transaction details and re-submit.'),
    'system'
  );

  RETURN json_build_object(
    'success', true,
    'enrollment_id', v_enrollment.id,
    'student_name', COALESCE(v_enrollment.user_email, 'Student'),
    'user_email', v_enrollment.user_email,
    'course_title', COALESCE(v_enrollment.course_title, 'Course'),
    'transaction_id', v_enrollment.transaction_id
  );
END;
$$;
