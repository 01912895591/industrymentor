-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  cover_image_path text
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published courses"
ON public.courses
FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Course enrollments (unlocks course after purchase)
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enrollments"
ON public.course_enrollments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all enrollments"
ON public.course_enrollments
FOR SELECT
USING (has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can create their own enrollments"
ON public.course_enrollments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage enrollments"
ON public.course_enrollments
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete enrollments"
ON public.course_enrollments
FOR DELETE
USING (has_role(auth.uid(), 'admin'::public.app_role));

-- Library
DO $$ BEGIN
  CREATE TYPE public.library_item_type AS ENUM ('ebook','sop');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  item_type public.library_item_type NOT NULL,
  item_key text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  file_path text,
  thumbnail_path text
);

ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published library items"
ON public.library_items
FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage library items"
ON public.library_items
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_library_items_updated_at
BEFORE UPDATE ON public.library_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Certificates
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_path text NOT NULL,
  UNIQUE (user_id, course_id)
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certificates"
ON public.certificates
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage certificates"
ON public.certificates
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

-- Finance
DO $$ BEGIN
  CREATE TYPE public.finance_txn_type AS ENUM ('income','expense');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.finance_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE
);

ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage finance categories"
ON public.finance_categories
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  txn_type public.finance_txn_type NOT NULL,
  amount_cents integer NOT NULL,
  category_id uuid REFERENCES public.finance_categories(id) ON DELETE SET NULL,
  note text,
  purchase_id uuid REFERENCES public.purchases(id) ON DELETE SET NULL,
  user_id uuid
);

ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage finance transactions"
ON public.finance_transactions
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

-- Auto-income on purchase inserts
CREATE OR REPLACE FUNCTION public.finance_on_purchase_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.finance_transactions (txn_type, amount_cents, note, purchase_id, user_id)
  VALUES ('income'::public.finance_txn_type, NEW.amount_cents, NEW.title, NEW.id, NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_finance_on_purchase_insert ON public.purchases;
CREATE TRIGGER trg_finance_on_purchase_insert
AFTER INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.finance_on_purchase_insert();

-- Storage buckets for files (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('library', 'library', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DO $$ BEGIN
  CREATE POLICY "Admins can manage library files"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'library' AND has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'library' AND has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can read their certificate files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'certificates'
    AND EXISTS (
      SELECT 1
      FROM public.certificates c
      WHERE c.user_id = auth.uid()
        AND c.certificate_path = storage.objects.name
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage certificate files"
  ON storage.objects
  FOR ALL
  USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::public.app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;