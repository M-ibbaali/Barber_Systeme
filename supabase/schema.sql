-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('admin', 'barber')) DEFAULT 'barber',
  is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Incomes table already exists, ensuring columns are correct
-- CREATE TABLE IF NOT EXISTS incomes ... (see existing)

-- Storage Setup (Avatars Bucket)
-- Note: Storage buckets are usually managed via UI or API, but here is the SQL for RLS
-- Assuming a bucket named 'avatars' exists.

-- Profiles Policies
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND 
    (CASE WHEN auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' THEN true ELSE role = 'barber' END)
  );

-- Function to handle new user profile creation (updated to handle name/role better)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    COALESCE(new.raw_user_meta_data->>'role', 'barber'),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url;
  RETURN NEW;
END;
$$;

-- Create a table for incomes
CREATE TABLE IF NOT EXISTS incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  time TIME DEFAULT CURRENT_TIME NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
-- Use DO blocks or DROP POLICY to make these idempotent if needed, 
-- but usually Supabase UI handles these. For the script, we'll keep it simple.
-- However, to be safe against "already exists" for policies:
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can do everything on profiles." ON profiles;
CREATE POLICY "Admins can do everything on profiles." ON profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- Incomes Policies
DROP POLICY IF EXISTS "Admins can view all incomes." ON incomes;
CREATE POLICY "Admins can view all incomes." ON incomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Barbers can view own incomes." ON incomes;
CREATE POLICY "Barbers can view own incomes." ON incomes
  FOR SELECT USING (auth.uid() = barber_id);

DROP POLICY IF EXISTS "Barbers can insert own incomes." ON incomes;
CREATE POLICY "Barbers can insert own incomes." ON incomes
  FOR INSERT WITH CHECK (auth.uid() = barber_id);

DROP POLICY IF EXISTS "Barbers can update own incomes for today only." ON incomes;
CREATE POLICY "Barbers can update own incomes for today only." ON incomes
  FOR UPDATE USING (
    auth.uid() = barber_id AND date = CURRENT_DATE
  );

DROP POLICY IF EXISTS "Barbers can delete own incomes for today only." ON incomes;
CREATE POLICY "Barbers can delete own incomes for today only." ON incomes
  FOR DELETE USING (
    auth.uid() = barber_id AND date = CURRENT_DATE
  );

DROP POLICY IF EXISTS "Admins can manage all incomes." ON incomes;
CREATE POLICY "Admins can manage all incomes." ON incomes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', 'User'), 
    COALESCE(new.raw_user_meta_data->>'role', 'barber')
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    name = EXCLUDED.name;
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SCRIPT DE SECOURS : Forcez votre email ici pour devenir Admin
-- REMPLACEMENT : Changez 'votre-email@exemple.com' par votre email réel
/*
DO $$
DECLARE
  target_email TEXT := 'votre-email@exemple.com';
BEGIN
  -- 1. On force le profil
  INSERT INTO public.profiles (id, name, role)
  SELECT id, COALESCE(raw_user_meta_data->>'name', 'Admin'), 'admin'
  FROM auth.users WHERE email = target_email
  ON CONFLICT (id) DO UPDATE SET role = 'admin';

  -- 2. On synchronise les métadonnées Auth (essentiel pour le RLS JWT)
  UPDATE auth.users 
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb), 
    '{role}', 
    '"admin"'
  ) 
  WHERE email = target_email;
END $$;
*/
