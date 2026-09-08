-- profiles table for user-visible info
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- RLS policies
create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- updated_at helper
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at_column();
-- Roles enum
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer helper
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

-- RLS: users can view their own roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Users can view their own roles'
  ) THEN
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- RLS: bootstrap first admin (one-time)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Bootstrap first admin'
  ) THEN
    CREATE POLICY "Bootstrap first admin"
    ON public.user_roles
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = user_id
      AND role = 'admin'
      AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
    );
  END IF;
END $$;

-- RLS: admins can manage roles
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_roles' AND policyname='Admins can manage roles'
  ) THEN
    CREATE POLICY "Admins can manage roles"
    ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Purchases table (demo payments)
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  item_key TEXT NOT NULL,
  title TEXT NOT NULL,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_type, item_key)
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='Users can view their own purchases'
  ) THEN
    CREATE POLICY "Users can view their own purchases"
    ON public.purchases
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='Users can create their own purchases'
  ) THEN
    CREATE POLICY "Users can create their own purchases"
    ON public.purchases
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='purchases' AND policyname='Admins can view all purchases'
  ) THEN
    CREATE POLICY "Admins can view all purchases"
    ON public.purchases
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Profiles: allow admins to view all profiles (read-only)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND policyname='Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
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
CREATE OR REPLACE FUNCTION public.course_on_purchase_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_id uuid;
BEGIN
  IF NEW.item_type = 'course' THEN
    SELECT id INTO c_id FROM public.courses WHERE slug = NEW.item_key LIMIT 1;
    IF c_id IS NOT NULL THEN
      INSERT INTO public.course_enrollments (user_id, course_id, purchase_id)
      VALUES (NEW.user_id, c_id, NEW.id)
      ON CONFLICT (user_id, course_id) DO UPDATE SET purchase_id = EXCLUDED.purchase_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_course_on_purchase_insert ON public.purchases;
CREATE TRIGGER trg_course_on_purchase_insert
AFTER INSERT ON public.purchases
FOR EACH ROW
EXECUTE FUNCTION public.course_on_purchase_insert();
-- Allow signed-in users to read finance categories (reference data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'finance_categories'
      AND policyname = 'Authenticated can view finance categories'
  ) THEN
    CREATE POLICY "Authenticated can view finance categories"
    ON public.finance_categories
    FOR SELECT
    USING (auth.uid() IS NOT NULL);
  END IF;
END$$;
-- Allow users to download library files they have purchased
-- Fixes type mismatch between purchases.item_type (text) and library_items.item_type (enum)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Users can read purchased library files'
  ) THEN
    CREATE POLICY "Users can read purchased library files"
    ON storage.objects
    FOR SELECT
    USING (
      bucket_id = 'library'
      AND auth.uid() IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.library_items li
        JOIN public.purchases p
          ON p.user_id = auth.uid()
         AND p.item_key = li.item_key
         AND p.item_type = (li.item_type::text)
        WHERE li.file_path = storage.objects.name
          AND li.published = true
      )
    );
  END IF;
END$$;
-- Blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text,
  excerpt text,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false
);

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blogs' AND policyname='Public can view published blogs'
  ) THEN
    CREATE POLICY "Public can view published blogs"
    ON public.blogs
    FOR SELECT
    USING (published = true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blogs' AND policyname='Admins can manage blogs'
  ) THEN
    CREATE POLICY "Admins can manage blogs"
    ON public.blogs
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END $$;

-- Update trigger
DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update library_items with new columns
ALTER TABLE public.library_items 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS category text;

-- Mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT,
    initials TEXT,
    tags TEXT[],
    linkedin_url TEXT,
    image_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to mentors"
ON public.mentors FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can manage mentors"
ON public.mentors FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- RPC for User Data
CREATE OR REPLACE FUNCTION get_pro_users_data()
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    u.email::text,
    u.phone::text,
    p.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id;
END;
$$;

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'read', 'replied'
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert messages"
ON public.messages FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Admins can manage messages"
ON public.messages FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
