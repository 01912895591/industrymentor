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
CREATE POLICY "Public can view published blogs"
ON public.blogs
FOR SELECT
USING (published = true);

CREATE POLICY "Admins can manage blogs"
ON public.blogs
FOR ALL
USING (has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::public.app_role));

-- Update trigger
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
