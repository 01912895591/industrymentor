-- Add image_url column to library_items
ALTER TABLE public.library_items 
ADD COLUMN IF NOT EXISTS image_url text;
