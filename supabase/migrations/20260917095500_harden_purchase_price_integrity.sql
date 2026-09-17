-- ====================================================================
-- INDUSTRYMENTOR: HARDEN PURCHASE PRICE & DATA INTEGRITY
-- Migration Version: 20260917095500_harden_purchase_price_integrity
--
-- Security Objective:
-- Enforce database-authoritative pricing for course purchases.
-- Prevent client-controlled amount manipulation (e.g. amount_cents = 0 or 1).
-- Prevent unauthorized purchase status privilege escalation (e.g. status = 'completed').
--
-- Security Rules Enforced:
-- 1. For course purchases (item_type = 'course'):
--    The database resolves the course from public.courses by UUID or slug,
--    validates course existence, and sets amount_cents to courses.price_cents.
--    Manipulated client amount_cents values are strictly overridden with real price.
-- 2. Course title is synchronized from the database.
-- 3. Non-admin students can only create purchases with status = 'pending'
--    for their own authenticated user_id.
-- 4. Preserves non-course library demo purchases ('ebook', 'sop').
-- 5. Preserves full admin management privileges.
-- 6. DOES NOT modify trg_finance_on_purchase_insert (reserved for STEP 4).
-- ====================================================================

-- Ensure RLS is enabled on public.purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 1. CREATE TRIGGER FUNCTION FOR DATABASE-AUTHORITATIVE PRICING
CREATE OR REPLACE FUNCTION public.validate_and_set_purchase_price()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_real_price integer;
  v_course_title text;
  v_course_exists boolean := false;
  v_is_admin boolean;
BEGIN
  -- Check admin authorization
  v_is_admin := public.has_role(auth.uid(), 'admin'::public.app_role);

  -- For non-admin students: enforce user ownership and pending status
  IF NOT v_is_admin THEN
    IF NEW.user_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Unauthorized purchase creation: user_id must match authenticated session';
    END IF;

    -- Ensure initial status is always 'pending'
    NEW.status := 'pending';
  END IF;

  -- Authoritative pricing for courses
  IF NEW.item_type = 'course' THEN
    -- Look up course by UUID (if valid UUID format) or by slug
    IF NEW.item_key ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      SELECT true, price_cents, title
      INTO v_course_exists, v_real_price, v_course_title
      FROM public.courses
      WHERE id = NEW.item_key::uuid
      LIMIT 1;
    END IF;

    -- If not found by UUID, look up by slug (for backward compatibility)
    IF NOT COALESCE(v_course_exists, false) THEN
      SELECT true, price_cents, title
      INTO v_course_exists, v_real_price, v_course_title
      FROM public.courses
      WHERE slug = NEW.item_key
      LIMIT 1;
    END IF;

    -- Validate course existence
    IF NOT COALESCE(v_course_exists, false) THEN
      RAISE EXCEPTION 'Course not found or invalid course reference: %', NEW.item_key;
    END IF;

    -- Overwrite client-provided amount with database authoritative price
    NEW.amount_cents := v_real_price;

    -- Preserve authentic course title from database
    IF v_course_title IS NOT NULL THEN
      NEW.title := v_course_title;
    END IF;

  ELSE
    -- For non-course purchases ('ebook', 'sop'):
    -- Preserve existing item price, but ensure status defaults to 'pending' if null
    IF NEW.status IS NULL THEN
      NEW.status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. BIND BEFORE INSERT TRIGGER
DROP TRIGGER IF EXISTS trg_validate_and_set_purchase_price ON public.purchases;
CREATE TRIGGER trg_validate_and_set_purchase_price
BEFORE INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.validate_and_set_purchase_price();

-- 3. HARDEN ROW-LEVEL SECURITY POLICIES ON PURCHASES
DROP POLICY IF EXISTS "Users can create their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Admins can manage purchases" ON public.purchases;

-- Student INSERT: Only own user_id and pending status allowed
CREATE POLICY "Users can insert their own purchases"
ON public.purchases
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
);

-- Admin Management: Admins retain full CRUD privileges
CREATE POLICY "Admins can manage purchases"
ON public.purchases
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Ensure SELECT policies are preserved
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
CREATE POLICY "Users can view their own purchases"
ON public.purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all purchases" ON public.purchases;
CREATE POLICY "Admins can view all purchases"
ON public.purchases
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
