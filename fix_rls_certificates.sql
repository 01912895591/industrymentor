-- FIX: Enable Users to Request Certificates
-- Run this in your Supabase SQL Editor

-- 1. Allow users to INSERT their own certificate requests
CREATE POLICY "Users can insert certificate requests"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 2. Allow users to UPDATE their own certificate requests (needed for upsert/retries)
CREATE POLICY "Users can update their own certificate requests"
ON public.certificates
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Create Notifications table if it doesn't exist (it was missing from consolidated migrations)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL, -- 'system', 'message'
  read boolean DEFAULT false
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 4. Allow users to view their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Allow Admins to insert notifications (for system alerts)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Admins can manage notifications'
  ) THEN
    CREATE POLICY "Admins can manage notifications"
    ON public.notifications
    FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'))
    WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;
