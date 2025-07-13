-- Update Storage Policies for cs-items-images bucket
-- Drop existing policies for the cs-items-images bucket
DROP POLICY IF EXISTS "Allow authenticated upload to cs-items-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on cs-items-images" ON storage.objects;

-- Create a more permissive policy for uploads (anyone can upload)
CREATE POLICY "Allow public upload to cs-items-images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'cs-items-images');

-- Create a more permissive policy for updates (anyone can update)
CREATE POLICY "Allow public update on cs-items-images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'cs-items-images');

-- Update Database Table Policies
-- Drop existing policy that requires authentication
DROP POLICY IF EXISTS "Allow authenticated insert on cs_items" ON public.cs_items;

-- Create a more permissive policy for inserts (anyone can insert)
CREATE POLICY "Allow public insert on cs_items"
  ON public.cs_items
  FOR INSERT
  WITH CHECK (true); 