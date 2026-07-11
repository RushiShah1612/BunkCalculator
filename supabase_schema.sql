-- Supabase Database Schema Setup for Student Attendance Tracker
-- (Idempotent script: Safe to run multiple times)

-- 1. PROFILES TABLE (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  institution TEXT,
  semester TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create policies for profiles
CREATE POLICY "Users can select their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" 
  ON public.profiles FOR DELETE 
  USING (auth.uid() = id);


-- 2. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  color_tag TEXT NOT NULL DEFAULT '#6366f1',
  credits INTEGER,
  semester TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  min_attendance NUMERIC NOT NULL DEFAULT 75,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on subjects
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can insert their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can update their own subjects" ON public.subjects;
DROP POLICY IF EXISTS "Users can delete their own subjects" ON public.subjects;

-- Create policies for subjects
CREATE POLICY "Users can select their own subjects" 
  ON public.subjects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subjects" 
  ON public.subjects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subjects" 
  ON public.subjects FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subjects" 
  ON public.subjects FOR DELETE 
  USING (auth.uid() = user_id);


-- 3. CLASS TYPES TABLE
CREATE TABLE IF NOT EXISTS public.class_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_hours NUMERIC NOT NULL,
  hours_per_session NUMERIC NOT NULL DEFAULT 1,
  timetable_days TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on class_types
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select class types of their subjects" ON public.class_types;
DROP POLICY IF EXISTS "Users can insert class types under their subjects" ON public.class_types;
DROP POLICY IF EXISTS "Users can update class types of their subjects" ON public.class_types;
DROP POLICY IF EXISTS "Users can delete class types of their subjects" ON public.class_types;

-- Create policies for class_types (via join checks on subjects)
CREATE POLICY "Users can select class types of their subjects" 
  ON public.class_types FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE public.subjects.id = public.class_types.subject_id 
      AND public.subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert class types under their subjects" 
  ON public.class_types FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE public.subjects.id = public.class_types.subject_id 
      AND public.subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update class types of their subjects" 
  ON public.class_types FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE public.subjects.id = public.class_types.subject_id 
      AND public.subjects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete class types of their subjects" 
  ON public.class_types FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.subjects 
      WHERE public.subjects.id = public.class_types.subject_id 
      AND public.subjects.user_id = auth.uid()
    )
  );


-- 4. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_type_id UUID REFERENCES public.class_types(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('PRESENT','ABSENT','CANCELLED','HOLIDAY')) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_type_id, date)
);

-- Enable RLS on attendance_records
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can insert their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can update their own attendance records" ON public.attendance_records;
DROP POLICY IF EXISTS "Users can delete their own attendance records" ON public.attendance_records;

-- Create policies for attendance_records
CREATE POLICY "Users can select their own attendance records" 
  ON public.attendance_records FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own attendance records" 
  ON public.attendance_records FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own attendance records" 
  ON public.attendance_records FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own attendance records" 
  ON public.attendance_records FOR DELETE 
  USING (auth.uid() = user_id);


-- 5. TRIGGER ON USER SIGNUP (auto-create profile record)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, institution, semester)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Student'),
    new.raw_user_meta_data->>'institution',
    new.raw_user_meta_data->>'semester'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Bind trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 6. INDEXES FOR PERFORMANCE OPTIMIZATIONS
CREATE INDEX IF NOT EXISTS idx_attendance_records_user_date ON public.attendance_records(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_class_type ON public.attendance_records(class_type_id);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);


-- 7. SHARED REPORTS TABLE
CREATE TABLE IF NOT EXISTS public.shared_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on shared_reports
ALTER TABLE public.shared_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read shared reports" ON public.shared_reports;
DROP POLICY IF EXISTS "Users can insert their own shared reports" ON public.shared_reports;
DROP POLICY IF EXISTS "Users can delete their own shared reports" ON public.shared_reports;

-- Create policies for shared_reports
CREATE POLICY "Anyone can read shared reports" 
  ON public.shared_reports FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own shared reports" 
  ON public.shared_reports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared reports" 
  ON public.shared_reports FOR DELETE 
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_shared_reports_user ON public.shared_reports(user_id);
