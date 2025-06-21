import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Database } from '@/types/supabase';

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
  // Construct the CSFloat API URL with parameters
  const csfloatUrl = new URL('https://csfloat.com/api/v1/listings');
  
  // Add default parameters
  csfloatUrl.searchParams.append('sort_by', 'lowest_price');
  csfloatUrl.searchParams.append('type', 'buy_now');
  
  // Add provided parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      csfloatUrl.searchParams.append(key, value.toString());
    }
  });
  
  // Set up request headers with API key
  const headers: HeadersInit = {};
  const apiKey = process.env.NEXT_PUBLIC_CSFLOAT_API_KEY;
  
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }
  
  // Make the request to CSFloat API
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
    
    // Return the price of the first listing (lowest price)
    return listings.data[0].price;
  } catch (error) {
    console.error('Error getting price:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify this is a valid cron request (you might want to add authentication)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Fetch all items from the database
    const { data: items, error: itemsError } = await supabase
      .from('cs_items')
      .select('*');
    
    if (itemsError) {
      throw new Error(`Failed to fetch items: ${itemsError.message}`);
    }
    
    if (!items || items.length === 0) {
      return NextResponse.json({ message: 'No items to update' });
    }
    
    console.log(`Starting price update for ${items.length} items`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    // Process items in batches to avoid overwhelming the API
    const batchSize = 5;
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (item: Database['public']['Tables']['cs_items']['Row']) => {
        try {
          // Skip items without required data
          if (!item.def_index || (item.min_float === null && item.max_float === null)) {
            results.skipped++;
            return;
          }
          
          const price = await getLowestPrice({
            def_index: item.def_index,
            paint_index: item.paint_index || undefined,
            min_float: item.min_float || undefined,
            max_float: item.max_float || undefined,
            category: item.category
          });
          
          if (price !== null) {
            // Insert the price into the database
            const { error: insertError } = await supabase
              .from('item_prices')
              .insert({
                item_id: item.id,
                price: price / 100, // Convert cents to dollars
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
          
        } catch (error) {
          results.failed++;
          const errorMessage = `Item ${item.id} (${item.def_name}): ${error instanceof Error ? error.message : 'Unknown error'}`;
          results.errors.push(errorMessage);
          console.error(errorMessage);
        }
      });
      
      await Promise.all(batchPromises);
      
      // Add delay between batches to be respectful to the API
      if (i + batchSize < items.length) {
        await delay(1000); // 1 second delay between batches
      }
    }
    
    console.log(`Price update completed. Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`);
    
    return NextResponse.json({
      message: 'Price update completed',
      results: {
        total: items.length,
        success: results.success,
        failed: results.failed,
        skipped: results.skipped
      },
      errors: results.errors.length > 0 ? results.errors : undefined
    });
    
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update prices',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Also allow GET for testing purposes (remove in production)
export async function GET() {
  return NextResponse.json({ 
    message: 'Price update cron job endpoint',
    schedule: 'Daily at 12:00 UTC',
    method: 'POST with Bearer token authorization required'
  });
} 