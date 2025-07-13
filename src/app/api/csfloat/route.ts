import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters from the request URL
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Construct the CSFloat API URL with the same parameters
    const csfloatUrl = new URL('https://csfloat.com/api/v1/listings');
    
    // Add default parameters
    csfloatUrl.searchParams.append('sort_by', 'lowest_price');
    csfloatUrl.searchParams.append('type', 'buy_now');
    
    // Copy all query parameters from the request
    searchParams.forEach((value, key) => {
      csfloatUrl.searchParams.append(key, value);
    });
    
    // Set up request headers with API key
    const headers: HeadersInit = {};
    const apiKey = process.env.NEXT_PUBLIC_CSFLOAT_API_KEY;
    
    if (apiKey) {
      headers['Authorization'] = apiKey;
    }
    
    // Make the request to CSFloat API from the server
    const response = await fetch(csfloatUrl.toString(), { headers });
    
    if (!response.ok) {
      throw new Error(`CSFloat API returned ${response.status}: ${response.statusText}`);
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the data from our API route
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error proxying CSFloat request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from CSFloat' },
      { status: 500 }
    );
  }
} 