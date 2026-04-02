
-- Fix 1: Add missing UPDATE policy for journal-photos storage
CREATE POLICY "Authenticated users can update own journal photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'journal-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'journal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Fix 2: Make daily_entries.user_id NOT NULL (clean up orphans first)
DELETE FROM public.daily_entries WHERE user_id IS NULL;
ALTER TABLE public.daily_entries ALTER COLUMN user_id SET NOT NULL;
