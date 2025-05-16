import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type InvestmentItem = {
  id: string;
  name: string;
  image_url: string;
  purchase_date: string;
  purchase_price: number;
  current_price: number;
  quantity: number;
  total_investment: number;
  total_current_value: number;
};

export type PriceHistory = {
  id: string;
  item_id: string;
  price: number;
  date: string;
}; 