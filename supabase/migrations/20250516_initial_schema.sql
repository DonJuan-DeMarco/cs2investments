-- Create the investments table
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  image_url TEXT,
  purchase_date DATE NOT NULL,
  purchase_price DECIMAL(12, 2) NOT NULL,
  current_price DECIMAL(12, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total_investment DECIMAL(12, 2) NOT NULL,
  total_current_value DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the price history table
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  price DECIMAL(12, 2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX investments_purchase_date_idx ON investments(purchase_date);
CREATE INDEX price_history_item_id_idx ON price_history(item_id);
CREATE INDEX price_history_date_idx ON price_history(date);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_investments_updated_at
BEFORE UPDATE ON investments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to automatically update price history
CREATE OR REPLACE FUNCTION add_price_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO price_history (item_id, price)
  VALUES (NEW.id, NEW.current_price);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically add price history when current_price changes
CREATE TRIGGER add_investment_price_history
AFTER UPDATE OF current_price ON investments
FOR EACH ROW
WHEN (OLD.current_price IS DISTINCT FROM NEW.current_price)
EXECUTE FUNCTION add_price_history(); 