-- Add new columns to the courses table for better metadata management
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'online',
ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 5.0,
ADD COLUMN IF NOT EXISTS reviews integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_text text DEFAULT 'Professional',
ADD COLUMN IF NOT EXISTS instructor_heading text DEFAULT 'Taught by Experts',
ADD COLUMN IF NOT EXISTS instructor_subheading text DEFAULT 'Industry Professionals',
ADD COLUMN IF NOT EXISTS old_price_cents integer;

-- Ensure existing rows have the defaults (if they were null for some reason during migration)
UPDATE public.courses SET mode = 'online' WHERE mode IS NULL;
UPDATE public.courses SET rating = 5.0 WHERE rating IS NULL;
UPDATE public.courses SET reviews = 0 WHERE reviews IS NULL;
UPDATE public.courses SET badge_text = 'Professional' WHERE badge_text IS NULL;
UPDATE public.courses SET instructor_heading = 'Taught by Experts' WHERE instructor_heading IS NULL;
UPDATE public.courses SET instructor_subheading = 'Industry Professionals' WHERE instructor_subheading IS NULL;
