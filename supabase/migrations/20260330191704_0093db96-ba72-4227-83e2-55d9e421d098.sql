
-- Create storage bucket for journal photos
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-photos', 'journal-photos', true);

-- Allow public access to read journal photos
CREATE POLICY "Public read access for journal photos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'journal-photos');

-- Allow public insert for journal photos
CREATE POLICY "Public insert access for journal photos" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'journal-photos');

-- Allow public delete for journal photos
CREATE POLICY "Public delete access for journal photos" ON storage.objects FOR DELETE TO public USING (bucket_id = 'journal-photos');
