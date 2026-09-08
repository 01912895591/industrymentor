-- Enable RLS for purchases and course_enrollments if not already enabled
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- 1. Policies for 'purchases' table

-- Allow insert
DROP POLICY IF EXISTS "Users can insert their own purchases" ON purchases;
CREATE POLICY "Users can insert their own purchases" 
ON purchases 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow select
DROP POLICY IF EXISTS "Users can view their own purchases" ON purchases;
CREATE POLICY "Users can view their own purchases" 
ON purchases 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- 2. Policies for 'course_enrollments' table

-- Allow insert
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON course_enrollments;
CREATE POLICY "Users can insert their own enrollments" 
ON course_enrollments 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow select
DROP POLICY IF EXISTS "Users can view their own enrollments" ON course_enrollments;
CREATE POLICY "Users can view their own enrollments" 
ON course_enrollments 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);
