/**
 * Service for getting item prices from the database
 * This replaces direct CSFloat API calls in the frontend
 */

import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/supabase';

type LatestPriceRow = Database['public']['Views']['latest_item_prices']['Row'];

export interface PriceData {
  price: number; // Price in cents (for consistency with CSFloat API)
  recorded_at: string;
  source: string;
}

/**
 * Get the latest price for a specific item
 */
export async function getItemPrice(itemId: number): Promise<PriceData | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('latest_item_prices')
      .select('*')
      .eq('item_id', itemId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      price: data.price_cents,
      recorded_at: data.recorded_at,
      source: data.source
    };
  } catch (error) {
    console.error(`Error fetching price for item ${itemId}:`, error);
    return null;
  }
}

/**
 * Get latest prices for multiple items
 */
export async function getItemPrices(itemIds: number[]): Promise<Record<number, PriceData | null>> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('latest_item_prices')
      .select('*')
      .in('item_id', itemIds);
    
    if (error) {
      throw error;
    }
    
    // Transform array into object keyed by item_id
    const priceMap: Record<number, PriceData | null> = {};
    
    // Initialize all requested items as null
    itemIds.forEach(id => {
      priceMap[id] = null;
    });
    
    // Fill in the data we have
    data?.forEach(row => {
      priceMap[row.item_id] = {
        price: row.price_cents,
        recorded_at: row.recorded_at,
        source: row.source
      };
    });
    
    return priceMap;
  } catch (error) {
    console.error('Error fetching prices for items:', error);
    
    // Return null for all requested items on error
    const priceMap: Record<number, PriceData | null> = {};
    itemIds.forEach(id => {
      priceMap[id] = null;
    });
    return priceMap;
  }
}

/**
 * Get price history for an item (last 30 days)
 */
export async function getItemPriceHistory(itemId: number, days: number = 30): Promise<PriceData[]> {
  try {
    const supabase = createClient();
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from('item_prices')
      .select('price_cents, recorded_at, source')
      .eq('item_id', itemId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data?.map(row => ({
      price: row.price_cents,
      recorded_at: row.recorded_at,
      source: row.source
    })) || [];
  } catch (error) {
    console.error(`Error fetching price history for item ${itemId}:`, error);
    return [];
  }
}

/**
 * Check when prices were last updated
 */
export async function getLastPriceUpdate(): Promise<string | null> {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('item_prices')
      .select('recorded_at')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.recorded_at;
  } catch (error) {
    console.error('Error fetching last price update:', error);
    return null;
  }
} 