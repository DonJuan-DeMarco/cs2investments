-- Make cs_items public again while keeping investments user-specific

-- Drop user-specific policies for cs_items
DROP POLICY IF EXISTS "Users can view their own items" ON cs_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON cs_items;
DROP POLICY IF EXISTS "Users can update their own items" ON cs_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON cs_items;

-- Remove user_id column from cs_items (it will become public again)
ALTER TABLE cs_items DROP COLUMN IF EXISTS user_id;

-- Drop the index since we're removing the column
DROP INDEX IF EXISTS cs_items_user_id_idx;

-- Restore original public policies for cs_items
CREATE POLICY "Allow public read access on cs_items"
  ON cs_items FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert on cs_items"
  ON cs_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on cs_items"
  ON cs_items FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on cs_items"
  ON cs_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- Keep investments user-specific (no changes needed to investments table) 