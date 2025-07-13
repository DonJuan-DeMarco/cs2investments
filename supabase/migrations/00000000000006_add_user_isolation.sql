-- Add user_id columns to make data user-specific
ALTER TABLE cs_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE investments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS cs_items_user_id_idx ON cs_items(user_id);
CREATE INDEX IF NOT EXISTS investments_user_id_idx ON investments(user_id);

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access on cs_items" ON cs_items;
DROP POLICY IF EXISTS "Allow authenticated insert on cs_items" ON cs_items;
DROP POLICY IF EXISTS "Allow authenticated update on cs_items" ON cs_items;

DROP POLICY IF EXISTS "Allow anonymous select" ON investments;
DROP POLICY IF EXISTS "Allow anonymous insert" ON investments;
DROP POLICY IF EXISTS "Allow anonymous update" ON investments;
DROP POLICY IF EXISTS "Allow anonymous delete" ON investments;

-- Create user-specific RLS policies for cs_items
CREATE POLICY "Users can view their own items" 
  ON cs_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items" 
  ON cs_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
  ON cs_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
  ON cs_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Create user-specific RLS policies for investments
CREATE POLICY "Users can view their own investments" 
  ON investments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own investments" 
  ON investments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own investments" 
  ON investments FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own investments" 
  ON investments FOR DELETE 
  USING (auth.uid() = user_id);

-- Update existing data to assign to a default user (optional - you may want to handle this differently)
-- This is useful if you have existing data that needs to be preserved
-- You can remove this section if you want to start fresh

-- Note: Since we don't have existing users, we'll let new data be created with proper user_ids
-- If you have existing data and a specific user you want to assign it to, 
-- you would update the records here with a specific user_id 