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