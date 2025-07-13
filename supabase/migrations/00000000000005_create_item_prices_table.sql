-- Create item_prices table to store historical pricing data
CREATE TABLE IF NOT EXISTS item_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id BIGINT NOT NULL REFERENCES cs_items(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL, -- Price in dollars (converted from cents)
  price_cents INTEGER NOT NULL, -- Original price in cents from CSFloat
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'csfloat' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_prices' AND column_name = 'recorded_at') THEN
    ALTER TABLE item_prices ADD COLUMN recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_prices' AND column_name = 'source') THEN
    ALTER TABLE item_prices ADD COLUMN source VARCHAR(50) DEFAULT 'csfloat' NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'item_prices' AND column_name = 'price_cents') THEN
    ALTER TABLE item_prices ADD COLUMN price_cents INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS item_prices_item_id_idx ON item_prices(item_id);
CREATE INDEX IF NOT EXISTS item_prices_recorded_at_idx ON item_prices(recorded_at);
CREATE INDEX IF NOT EXISTS item_prices_item_recorded_idx ON item_prices(item_id, recorded_at DESC);

-- Add RLS policies
ALTER TABLE item_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access to price data
CREATE POLICY "Allow public select on item_prices" 
  ON item_prices FOR SELECT 
  USING (true);

-- Allow system to insert price updates (for cron job)
CREATE POLICY "Allow public insert on item_prices" 
  ON item_prices FOR INSERT 
  WITH CHECK (true);

-- Create a view for getting latest prices per item
CREATE OR REPLACE VIEW latest_item_prices AS
SELECT DISTINCT ON (item_id) 
  item_id,
  price,
  price_cents,
  recorded_at,
  source
FROM item_prices
ORDER BY item_id, recorded_at DESC;

-- Grant access to the view
GRANT SELECT ON latest_item_prices TO anon;
GRANT SELECT ON latest_item_prices TO authenticated; 