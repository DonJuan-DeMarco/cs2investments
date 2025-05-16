// API service for fetching CS2 items data

// CSFloat API wrapper
export async function fetchCSFloatItems(query: string = '') {
  try {
    const apiKey = process.env.CSFLOAT_API_KEY;
    const response = await fetch(`https://csfloat.com/api/v1/search?search=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch items from CSFloat');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching items from CSFloat:', error);
    // Fallback to Steam market if CSFloat fails
    return fetchSteamMarketItems(query);
  }
}

// Steam Market API fallback
export async function fetchSteamMarketItems(query: string = '') {
  try {
    // Steam does not have an official API for market listings
    // This is a workaround using the community market search
    const response = await fetch(`https://steamcommunity.com/market/search/render/?query=${encodeURIComponent(query)}&appid=730&norender=1`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch items from Steam Market');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching items from Steam Market:', error);
    return { items: [] };
  }
}

// Get current price for a specific item
export async function getItemCurrentPrice(itemName: string): Promise<number> {
  try {
    const items = await fetchCSFloatItems(itemName);
    if (items && items.items && items.items.length > 0) {
      return items.items[0].price || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching current price:', error);
    return 0;
  }
}

// Format price in USD
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
} 