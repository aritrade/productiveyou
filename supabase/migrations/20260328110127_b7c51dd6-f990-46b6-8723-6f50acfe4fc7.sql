-- Daily entries table to persist all daily tracking data
CREATE TABLE public.daily_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL UNIQUE,
  non_negotiables JSONB NOT NULL DEFAULT '{}'::jsonb,
  habits JSONB NOT NULL DEFAULT '{}'::jsonb,
  journal_entries JSONB NOT NULL DEFAULT '[]'::jsonb,
  todos JSONB NOT NULL DEFAULT '[]'::jsonb,
  percentage INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for date-range queries
CREATE INDEX idx_daily_entries_date ON public.daily_entries (entry_date DESC);

-- Enable RLS (public access for now - no auth)
ALTER TABLE public.daily_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select on daily_entries"
  ON public.daily_entries FOR SELECT USING (true);

CREATE POLICY "Allow all insert on daily_entries"
  ON public.daily_entries FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all update on daily_entries"
  ON public.daily_entries FOR UPDATE USING (true);

CREATE POLICY "Allow all delete on daily_entries"
  ON public.daily_entries FOR DELETE USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_daily_entries_updated_at
  BEFORE UPDATE ON public.daily_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();