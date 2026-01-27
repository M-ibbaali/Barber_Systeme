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
  is_deleted BOOLEAN DEFAULT FALSE, -- SOFT DELETE for non-repudiation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- CREATE Audit Logs Table
CREATE TABLE IF NOT EXISTS income_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  income_id UUID NOT NULL,
  barber_id UUID REFERENCES profiles(id),
  action_type TEXT CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_audit_logs ENABLE ROW LEVEL SECURITY;

-- ... (Profiles Policies same as before) ...

-- Incomes Policies (Updated for Audit)
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
  FOR SELECT USING (
    auth.uid() = barber_id AND is_deleted = FALSE
  );

DROP POLICY IF EXISTS "Barbers can insert own incomes." ON incomes;
CREATE POLICY "Barbers can insert own incomes." ON incomes
  FOR INSERT WITH CHECK (auth.uid() = barber_id);

DROP POLICY IF EXISTS "Barbers can update own incomes for today only." ON incomes;
CREATE POLICY "Barbers can update own incomes for today only." ON incomes
  FOR UPDATE USING (
    auth.uid() = barber_id AND date = CURRENT_DATE
  );

-- Note: Barbers no longer hard delete. They update is_deleted = TRUE.
DROP POLICY IF EXISTS "Barbers can delete own incomes for today only." ON incomes;

-- Audit Logs Policies
DROP POLICY IF EXISTS "Admins can view all audit logs." ON income_audit_logs;
CREATE POLICY "Admins can view all audit logs." ON income_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Function to handle Audit Logging
CREATE OR REPLACE FUNCTION audit_income_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO income_audit_logs (income_id, barber_id, action_type, new_values)
    VALUES (NEW.id, NEW.barber_id, 'CREATE', row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Detect if it's a soft delete or a real update
    IF (OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE) THEN
      INSERT INTO income_audit_logs (income_id, barber_id, action_type, old_values, new_values)
      VALUES (OLD.id, OLD.barber_id, 'DELETE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    ELSE
      INSERT INTO income_audit_logs (income_id, barber_id, action_type, old_values, new_values)
      VALUES (OLD.id, OLD.barber_id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auditing
DROP TRIGGER IF EXISTS on_income_change ON incomes;
CREATE TRIGGER on_income_change
  AFTER INSERT OR UPDATE ON incomes
  FOR EACH ROW EXECUTE PROCEDURE audit_income_change();

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
