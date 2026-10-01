-- Migration: 20261001170000_telegram_pending_enrollment_lookup_rpc.sql
-- Description: Create Security Definer RPC for fetching pending course enrollments for Telegram 1-click gateway

CREATE OR REPLACE FUNCTION public.get_pending_enrollment_for_telegram(
  p_tx_id text DEFAULT NULL,
  p_user_email text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_enrollment record;
BEGIN
  -- Strategy 1: Search by Transaction ID if provided
  IF p_tx_id IS NOT NULL AND length(trim(p_tx_id)) > 0 THEN
    SELECT e.id, e.user_id, e.course_id, e.purchase_id, e.status, e.transaction_id, e.payment_method, e.sender_phone, e.created_at,
           c.title as course_title, c.price_cents as course_price_cents, p.amount_cents as purchase_amount_cents, prof.email as user_email
    INTO v_enrollment
    FROM public.course_enrollments e
    LEFT JOIN public.courses c ON c.id = e.course_id
    LEFT JOIN public.purchases p ON p.id = e.purchase_id
    LEFT JOIN public.profiles prof ON prof.user_id = e.user_id
    WHERE e.status = 'pending'
      AND (e.transaction_id ILIKE trim(p_tx_id) OR trim(p_tx_id) ILIKE CONCAT('%', e.transaction_id, '%'))
    ORDER BY e.created_at DESC
    LIMIT 1;
  END IF;

  -- Strategy 2: Search by User Email from profiles if Strategy 1 found nothing
  IF v_enrollment.id IS NULL AND p_user_email IS NOT NULL AND length(trim(p_user_email)) > 0 THEN
    SELECT e.id, e.user_id, e.course_id, e.purchase_id, e.status, e.transaction_id, e.payment_method, e.sender_phone, e.created_at,
           c.title as course_title, c.price_cents as course_price_cents, p.amount_cents as purchase_amount_cents, prof.email as user_email
    INTO v_enrollment
    FROM public.course_enrollments e
    LEFT JOIN public.courses c ON c.id = e.course_id
    LEFT JOIN public.purchases p ON p.id = e.purchase_id
    LEFT JOIN public.profiles prof ON prof.user_id = e.user_id
    WHERE e.status = 'pending'
      AND prof.email ILIKE trim(p_user_email)
    ORDER BY e.created_at DESC
    LIMIT 1;
  END IF;

  -- Strategy 3: Fallback to most recent pending enrollment if still nothing found
  IF v_enrollment.id IS NULL THEN
    SELECT e.id, e.user_id, e.course_id, e.purchase_id, e.status, e.transaction_id, e.payment_method, e.sender_phone, e.created_at,
           c.title as course_title, c.price_cents as course_price_cents, p.amount_cents as purchase_amount_cents, prof.email as user_email
    INTO v_enrollment
    FROM public.course_enrollments e
    LEFT JOIN public.courses c ON c.id = e.course_id
    LEFT JOIN public.purchases p ON p.id = e.purchase_id
    LEFT JOIN public.profiles prof ON prof.user_id = e.user_id
    WHERE e.status = 'pending'
    ORDER BY e.created_at DESC
    LIMIT 1;
  END IF;

  -- If still no record found, return null
  IF v_enrollment.id IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN json_build_object(
    'found', true,
    'id', v_enrollment.id,
    'user_id', v_enrollment.user_id,
    'course_id', v_enrollment.course_id,
    'purchase_id', v_enrollment.purchase_id,
    'status', v_enrollment.status,
    'transaction_id', v_enrollment.transaction_id,
    'payment_method', v_enrollment.payment_method,
    'sender_phone', v_enrollment.sender_phone,
    'course_title', COALESCE(v_enrollment.course_title, 'Selected Course'),
    'amount_cents', COALESCE(v_enrollment.purchase_amount_cents, v_enrollment.course_price_cents, 350000),
    'user_email', COALESCE(v_enrollment.user_email, p_user_email)
  );
END;
$$;
