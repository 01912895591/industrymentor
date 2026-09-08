
-- Create mentors table
CREATE TABLE IF NOT EXISTS public.mentors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    bio TEXT,
    initials TEXT,
    tags TEXT[], -- Array of strings for tags
    linkedin_url TEXT,
    image_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow public to read
CREATE POLICY "Allow public read access to mentors"
ON public.mentors FOR SELECT
TO public
USING (true);

-- Allow admins to write (Insert, Update, Delete)
-- NOTE: Using the same logic as other admin-only tables
CREATE POLICY "Allow authenticated admins to manage mentors"
ON public.mentors FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
