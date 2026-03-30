
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name text,
  custom_non_negotiables jsonb NOT NULL DEFAULT '[]'::jsonb,
  custom_habits jsonb NOT NULL DEFAULT '[]'::jsonb,
  consistency_duration_months integer NOT NULL DEFAULT 24,
  streak_start_date date NOT NULL DEFAULT CURRENT_DATE,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add user_id to daily_entries
ALTER TABLE public.daily_entries ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop old unique constraint on entry_date and add composite unique
ALTER TABLE public.daily_entries DROP CONSTRAINT IF EXISTS daily_entries_entry_date_key;
ALTER TABLE public.daily_entries ADD CONSTRAINT daily_entries_user_date_unique UNIQUE (user_id, entry_date);

-- Replace open RLS policies with user-scoped ones
DROP POLICY IF EXISTS "Allow all delete on daily_entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Allow all insert on daily_entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Allow all select on daily_entries" ON public.daily_entries;
DROP POLICY IF EXISTS "Allow all update on daily_entries" ON public.daily_entries;

CREATE POLICY "Users can read own entries" ON public.daily_entries FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own entries" ON public.daily_entries FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own entries" ON public.daily_entries FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete own entries" ON public.daily_entries FOR DELETE TO authenticated USING (user_id = auth.uid());
