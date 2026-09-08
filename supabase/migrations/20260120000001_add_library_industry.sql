-- Add organization columns to library_items
ALTER TABLE public.library_items 
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS category text;
