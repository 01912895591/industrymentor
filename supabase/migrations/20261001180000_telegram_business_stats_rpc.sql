-- Migration: 20261001180000_telegram_business_stats_rpc.sql
-- Description: Security Definer RPC for fetching live business stats for Telegram bot commands (/today, /pending, /students)

CREATE OR REPLACE FUNCTION public.get_telegram_business_stats(p_type text DEFAULT 'today')
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_24h_ago timestamptz := NOW() - INTERVAL '24 hours';
  v_result json;
  v_total_students int := 0;
  v_total_enrollments int := 0;
  v_active_enrollments int := 0;
  v_pending_enrollments int := 0;
  v_total_certs int := 0;
  v_today_revenue_cents bigint := 0;
  v_today_enrollments int := 0;
  v_today_active int := 0;
  v_today_pending int := 0;
  v_bkash_cents bigint := 0;
  v_nagad_cents bigint := 0;
  v_rocket_cents bigint := 0;
  v_pending_list json;
BEGIN
  IF p_type = 'today' THEN
    -- Today's Revenue & Purchases
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_today_revenue_cents
    FROM public.purchases
    WHERE created_at >= v_24h_ago;

    -- Method breakdown
    SELECT COALESCE(SUM(amount_cents), 0) INTO v_bkash_cents
    FROM public.purchases
    WHERE created_at >= v_24h_ago AND LOWER(payment_method) LIKE '%bkash%';

    SELECT COALESCE(SUM(amount_cents), 0) INTO v_nagad_cents
    FROM public.purchases
    WHERE created_at >= v_24h_ago AND LOWER(payment_method) LIKE '%nagad%';

    SELECT COALESCE(SUM(amount_cents), 0) INTO v_rocket_cents
    FROM public.purchases
    WHERE created_at >= v_24h_ago AND (LOWER(payment_method) LIKE '%rocket%' OR LOWER(payment_method) LIKE '%other%');

    -- Today's Enrollments
    SELECT COUNT(*), 
           COUNT(*) FILTER (WHERE status = 'active'),
           COUNT(*) FILTER (WHERE status = 'pending')
    INTO v_today_enrollments, v_today_active, v_today_pending
    FROM public.course_enrollments
    WHERE created_at >= v_24h_ago;

    RETURN json_build_object(
      'success', true,
      'today_revenue_bdt', ROUND(v_today_revenue_cents / 100.0, 2),
      'today_enrollments', v_today_enrollments,
      'today_active', v_today_active,
      'today_pending', v_today_pending,
      'bkash_bdt', ROUND(v_bkash_cents / 100.0, 2),
      'nagad_bdt', ROUND(v_nagad_cents / 100.0, 2),
      'rocket_other_bdt', ROUND(v_rocket_cents / 100.0, 2)
    );

  ELSIF p_type = 'pending' THEN
    -- Fetch list of pending enrollments (up to 10)
    SELECT COALESCE(json_agg(t), '[]'::json) INTO v_pending_list
    FROM (
      SELECT e.id, e.transaction_id, e.payment_method, e.sender_phone, e.created_at,
             COALESCE(c.title, 'Course') as course_title,
             COALESCE(c.price_cents, 350000) as price_cents,
             COALESCE(p.full_name, 'Student') as student_name,
             COALESCE(p.email, 'N/A') as student_email
      FROM public.course_enrollments e
      LEFT JOIN public.courses c ON c.id = e.course_id
      LEFT JOIN public.profiles p ON p.user_id = e.user_id
      WHERE e.status = 'pending'
      ORDER BY e.created_at DESC
      LIMIT 10
    ) t;

    SELECT COUNT(*) INTO v_pending_enrollments
    FROM public.course_enrollments
    WHERE status = 'pending';

    RETURN json_build_object(
      'success', true,
      'total_pending', v_pending_enrollments,
      'pending_list', v_pending_list
    );

  ELSIF p_type = 'students' THEN
    -- Total registered users / profiles count
    SELECT COUNT(*) INTO v_total_students FROM public.profiles;
    
    -- Enrollments stats
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'active')
    INTO v_total_enrollments, v_active_enrollments
    FROM public.course_enrollments;

    -- Certificates
    SELECT COUNT(*) INTO v_total_certs FROM public.certificates WHERE status = 'approved' OR status IS NULL;

    RETURN json_build_object(
      'success', true,
      'total_students', GREATEST(v_total_students, 1),
      'total_enrollments', v_total_enrollments,
      'active_learners', v_active_enrollments,
      'certificates_earned', v_total_certs
    );

  END IF;

  RETURN json_build_object('success', false, 'error', 'Invalid type parameter');
END;
$$;
