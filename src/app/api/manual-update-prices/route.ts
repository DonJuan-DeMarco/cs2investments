import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CSFloatListing {
  id: string;
  price: number;
  wear_value: number;
  def_index: number;
  paint_index: number;
  market_hash_name: string;
}

interface CSFloatListingParams {
  def_index?: number;
  paint_index?: number;
  min_float?: number;
  max_float?: number;
  category?: number;
  limit?: number;
}

async function fetchListingsFromCSFloat(params: CSFloatListingParams): Promise<{cursor: string, data: CSFloatListing[]}> {
  const csfloatUrl = new URL('https://csfloat.com/api/v1/listings');
  
  csfloatUrl.searchParams.append('sort_by', 'lowest_price');
  csfloatUrl.searchParams.append('type', 'buy_now');
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      csfloatUrl.searchParams.append(key, value.toString());
    }
  });
  
  const headers: HeadersInit = {};
  const apiKey = process.env.NEXT_PUBLIC_CSFLOAT_API_KEY;
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }
  
  const response = await fetch(csfloatUrl.toString(), { headers });
  
  if (!response.ok) {
    throw new Error(`CSFloat API returned ${response.status}: ${response.statusText}`);
  }
  
  return await response.json();
}

async function getLowestPrice(params: CSFloatListingParams): Promise<number | null> {
  try {
    const listings = await fetchListingsFromCSFloat({ ...params, limit: 5 });
    
    if (listings.data.length === 0) {
      return null;
    }
    
    return listings.data[0].price;
  } catch (error) {
    console.error('Error getting price:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // For manual updates, we'll limit to recent items or items that need updates
    // This prevents overwhelming the API on manual requests
    const { data: items, error: itemsError } = await supabase
      .from('cs_items')
      .select('*')
      // .limit(10) // Limit to 10 items for manual updates
      .order('created_at', { ascending: false });
    
    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No items to update' });
    }
    
    console.log(`Starting manual price update for ${items.length} items`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process items sequentially to be more conservative with API calls
    for (const item of items) {
      try {
        if (!item.def_index || (item.min_float === null && item.max_float === null)) {
          results.skipped++;
          continue;
        }
        
        const price = await getLowestPrice({
          def_index: item.def_index,
          paint_index: item.paint_index || undefined,
          min_float: item.min_float || undefined,
          max_float: item.max_float || undefined,
          category: item.category
        });
        
        if (price !== null) {
          const { error: insertError } = await supabase
            .from('item_prices')
            .insert({
              item_id: item.id,
              price: price / 100,
              price_cents: price,
              source: 'csfloat'
            });
          
          if (insertError) {
            throw new Error(`Failed to insert price for item ${item.id}: ${insertError.message}`);
          }
          
          results.success++;
          console.log(`Updated price for item ${item.id} (${item.def_name}): $${(price / 100).toFixed(2)}`);
        } else {
          results.skipped++;
          console.log(`No price data found for item ${item.id} (${item.def_name})`);
        }
        
        // Add small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 10000));
        
      } catch (error) {
        results.failed++;
        const errorMessage = `Item ${item.id} (${item.def_name}): ${error instanceof Error ? error.message : 'Unknown error'}`;
        results.errors.push(errorMessage);
        console.error(errorMessage);
      }
    }
    
    console.log(`Manual price update completed. Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    
    return NextResponse.json({
      message: 'Manual price update completed',
      results: {
        total: items.length,
        success: results.success,
        failed: results.failed,
        skipped: results.skipped
      },
      errors: results.errors.length > 0 ? results.errors : undefined
    });
    
  } catch (error) {
    console.error('Manual price update error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 