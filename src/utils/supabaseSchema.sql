-- ==========================================
-- WD360 DATABASE SCHEMA (Supabase SQL Editor)
-- Copy and paste this script in your Supabase SQL Editor.
-- ==========================================

-- 1. Create Profiles Table (Stores plans and user limits)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can insert/update their own profile" 
ON public.profiles FOR ALL 
USING (auth.uid() = id);


-- 2. Create Tours Table (Stores tours, scenes, and hotspot structures)
CREATE TABLE IF NOT EXISTS public.tours (
  id TEXT PRIMARY KEY, -- Client-side generated string ID
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scenes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Tours
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own tours" 
ON public.tours FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own tours" 
ON public.tours FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tours" 
ON public.tours FOR DELETE 
USING (auth.uid() = user_id);

-- Enable Public read for preview share links (embedded iframe views)
CREATE POLICY "Public read access to preview tour" 
ON public.tours FOR SELECT 
USING (true);


-- 3. Configure Storage Bucket for Renders (Optional instructions)
-- Note: Create a public storage bucket named "renders360" in your Supabase console.
-- Then apply these storage policies:

-- ALLOW PUBLIC READ OF Renders:
-- (Allows iframe views to download the 360 texture files)
-- Policy Name: "Public Access"
-- Action: SELECT
-- Target: renders360 bucket
-- Condition: true

-- ALLOW AUTHENTICATED UPLOAD:
-- Policy Name: "Authenticated Upload"
-- Action: INSERT/UPDATE
-- Target: renders360 bucket
-- Condition: auth.role() = 'authenticated'
