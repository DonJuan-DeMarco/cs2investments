import { Database } from './supabase';

export type ItemRow = Database['public']['Tables']['cs_items']['Row'];

export interface Investment {
  id: string;
  itemId: number;
  item: ItemRow;
  purchaseDate: string;
  purchasePrice: number;
  quantity: number;
  createdAt: string;
}

export type InvestmentInput = Omit<Investment, 'id' | 'item' | 'createdAt'>; 