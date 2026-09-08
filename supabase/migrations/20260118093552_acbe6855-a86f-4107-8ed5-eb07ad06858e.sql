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