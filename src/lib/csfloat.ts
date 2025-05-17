/**
 * Service for interacting with the CSFloat API
 * Documentation: https://docs.csfloat.com/
 */

export interface CSFloatListingParams {
  def_index?: number;
  paint_index?: number;
  min_float?: number;
  max_float?: number;
  category?: number;
  limit?: number;
}

export interface CSFloatListing {
  id: string;
  price: number;
  currency: string;
  wear_value: number;
  def_index: number;
  paint_index: number;
  market_hash_name: string;
  // Add more fields as needed
}

// CSFloat API key - should be set as environment variable
const CSFLOAT_API_KEY = process.env.NEXT_PUBLIC_CSFLOAT_API_KEY;

/**
 * Fetches listings from CSFloat API based on item parameters
 */
export async function fetchListings(params: CSFloatListingParams): Promise<{cursor: string, data: CSFloatListing[]}> {
  try {
    // Construct URL with query parameters
    const url = new URL('/api/csfloat', window.location.origin);
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching CSFloat listings:', error);
    throw error;
  }
}

/**
 * Gets the price for an item with the specified parameters
 * Returns the price of the first (lowest price) listing
 */
export async function getAveragePrice(params: CSFloatListingParams): Promise<number | null> {
  try {
    // Set a reasonable limit (we only need the first one, but request a few in case some fail)
    const listings = await fetchListings({ ...params, limit: 5 });
    
    if (listings.data.length === 0) {
      return null;
    }
    
    // Just return the price of the first listing (which should be the lowest price)
    return listings.data[0].price;
  } catch (error) {
    console.error('Error getting price:', error);
    return null;
  }
} 