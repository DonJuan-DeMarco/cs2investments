-- Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id BIGINT NOT NULL REFERENCES cs_items(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS investments_item_id_idx ON investments(item_id);
CREATE INDEX IF NOT EXISTS investments_purchase_date_idx ON investments(purchase_date);

-- Add RLS policies
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for now (adjust based on your auth needs)
CREATE POLICY "Allow anonymous select" 
  ON investments FOR SELECT 
  USING (true);

CREATE POLICY "Allow anonymous insert" 
  ON investments FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow anonymous update" 
  ON investments FOR UPDATE 
  USING (true);

CREATE POLICY "Allow anonymous delete" 
  ON investments FOR DELETE 
  USING (true); 