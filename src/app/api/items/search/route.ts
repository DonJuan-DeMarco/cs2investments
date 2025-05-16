import { NextResponse } from 'next/server';
import { fetchCSFloatItems, fetchSteamMarketItems } from '@/lib/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    
    const data = await fetchCSFloatItems(query);
    
    if (data && data.items && data.items.length > 0) {
      return NextResponse.json(data.items);
    }
    
    // Fallback to Steam Market API if CSFloat returns no results
    const steamData = await fetchSteamMarketItems(query);
    return NextResponse.json(steamData.results || []);
  } catch (error) {
    console.error('Error searching for items:', error);
    return NextResponse.json({ error: 'Failed to search for items' }, { status: 500 });
  }
} 