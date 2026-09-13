-- ====================================================================
-- INDUSTRYMENTOR: P0 CRITICAL SECURITY HARDENING & PAYMENT INTEGRITY
-- Migration Version: 20260909000000
-- ====================================================================

-- 1. EXTEND COURSE_ENROLLMENTS & PURCHASES SCHEMA (NON-DESTRUCTIVE)
-- Add audit columns to capture transaction ID, payment method, sender phone, and approval status
ALTER TABLE public.course_enrollments
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bkash',
  ADD COLUMN IF NOT EXISTS sender_phone text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'bkash',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Ensure existing legacy enrollments retain active status
UPDATE public.course_enrollments SET status = 'active' WHERE status IS NULL;
UPDATE public.purchases SET status = 'active' WHERE status IS NULL;

-- 2. HARDEN SITE_SETTINGS ROW LEVEL SECURITY (RLS)
-- Prevent non-admin authenticated users from modifying platform settings
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop legacy over-permissive policies if they exist
DROP POLICY IF EXISTS "Allow authenticated insert/update" ON public.site_settings;
DROP POLICY IF EXISTS "Anyone can view site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public read access" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Only admins can manage site settings" ON public.site_settings;

-- Public can read site branding/settings
CREATE POLICY "Anyone can view site settings"
ON public.site_settings
FOR SELECT
TO public
USING (true);

-- Only verified admins can insert, update, or delete site settings
CREATE POLICY "Only admins can manage site settings"
ON public.site_settings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. HARDEN STORAGE BUCKET POLICIES FOR SITE_ASSETS
-- Prevent authenticated regular users from overwriting or deleting site assets
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload to site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete from site-assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload site_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update site_assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete site_assets" ON storage.objects;

-- Only admins can upload, update, or delete in site_assets and site-assets buckets
CREATE POLICY "Admins can upload site_assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('site_assets', 'site-assets')
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update site_assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('site_assets', 'site-assets')
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id IN ('site_assets', 'site-assets')
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete site_assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id IN ('site_assets', 'site-assets')
  AND public.has_role(auth.uid(), 'admin')
);

-- 4. HARDEN CERTIFICATE STATUS MODIFICATION (PREVENT PRIVILEGE ESCALATION)
-- Ensure normal users can only submit or update requests in 'pending' status
DROP POLICY IF EXISTS "Users can insert certificate requests" ON public.certificates;
DROP POLICY IF EXISTS "Users can update their own certificate requests" ON public.certificates;
DROP POLICY IF EXISTS "Public can view approved certificates" ON public.certificates;

CREATE POLICY "Users can insert certificate requests"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
);

CREATE POLICY "Users can update their own certificate requests"
ON public.certificates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND (status IS NULL OR status = 'pending')
);

-- Public can inspect approved certificates
CREATE POLICY "Public can view approved certificates"
ON public.certificates
FOR SELECT
TO public
USING (status = 'approved');

-- 5. SECURE CERTIFICATE VERIFICATION RPC (PREVENTS IDOR / SENSITIVE PROFILE EXPOSURE)
-- Returns only non-sensitive verification data (name, course, issuance date)
CREATE OR REPLACE FUNCTION public.get_verified_certificate(cert_id uuid)
RETURNS TABLE (
  id uuid,
  student_name text,
  course_title text,
  issued_at timestamptz,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    COALESCE(p.full_name, 'Verified Student') AS student_name,
    COALESCE(co.title, 'Professional Course') AS course_title,
    c.issued_at,
    c.status
  FROM public.certificates c
  LEFT JOIN public.profiles p ON p.user_id = c.user_id
  LEFT JOIN public.courses co ON co.id = c.course_id
  WHERE c.id = cert_id
    AND c.status = 'approved'
  LIMIT 1;
END;
$$;

-- Allow public access to the verification function
GRANT EXECUTE ON FUNCTION public.get_verified_certificate(uuid) TO anon, authenticated;
