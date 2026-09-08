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