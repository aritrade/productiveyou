
-- Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'journal-photos';

-- Drop existing public policies
DROP POLICY IF EXISTS "Public read access for journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Public insert access for journal photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access for journal photos" ON storage.objects;

-- Create authenticated, user-scoped policies using user_id folder prefix
CREATE POLICY "Authenticated users can read own journal photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'journal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can upload own journal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'journal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Authenticated users can delete own journal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'journal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
