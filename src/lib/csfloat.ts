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
export async function fetchListings(params: CSFloatListingParams): Promise<CSFloatListing[]> {
  try {
    // Construct URL with query parameters
    const url = new URL('https://csfloat.com/api/v1/listings');
    
    // Add parameters to URL
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    
    // Set up request headers with API key
    const headers: HeadersInit = {};
    
    if (CSFLOAT_API_KEY) {
      headers['Authorization'] = CSFLOAT_API_KEY;
    } else {
      console.warn('CSFLOAT_API_KEY is not set. API requests may be rate limited or rejected.');
    }
    
    const response = await fetch(url.toString(), {
      headers
    });
    
    if (!response.ok) {
      throw new Error(`CSFloat API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching CSFloat listings:', error);
    throw error;
  }
}

/**
 * Gets the average price for an item with the specified parameters
 */
export async function getAveragePrice(params: CSFloatListingParams): Promise<number | null> {
  try {
    // Set a reasonable limit to get a good average
    const listings = await fetchListings({ ...params, limit: 5 });
    
    if (listings.length === 0) {
      return null;
    }
    
    // Calculate average price
    const sum = listings.reduce((total, listing) => total + listing.price, 0);
    return sum / listings.length;
  } catch (error) {
    console.error('Error getting average price:', error);
    return null;
  }
} 