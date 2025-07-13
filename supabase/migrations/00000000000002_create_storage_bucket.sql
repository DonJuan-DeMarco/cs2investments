-- Create a bucket for CS2 item images
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('cs-items-images', 'cs-items-images', true, false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for public access to storage
-- Allow public read access to the cs-items-images bucket
CREATE POLICY "Allow public read access on cs-items-images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'cs-items-images');

-- Allow authenticated users to upload to the cs-items-images bucket
CREATE POLICY "Allow authenticated upload to cs-items-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'cs-items-images' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own objects in the cs-items-images bucket
CREATE POLICY "Allow authenticated update on cs-items-images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'cs-items-images' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to delete their own objects in the cs-items-images bucket
CREATE POLICY "Allow authenticated delete on cs-items-images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'cs-items-images' AND
    auth.role() = 'authenticated'
  ); 