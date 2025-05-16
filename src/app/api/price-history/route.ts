import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET price history for a specific item
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('item_id', itemId)
      .order('date', { ascending: true });

    if (error) throw error;
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching price history:', error);
    return NextResponse.json({ error: 'Failed to fetch price history' }, { status: 500 });
  }
}

// POST a new price entry to the history
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { item_id, price } = body;

    if (!item_id || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.from('price_history').insert([
      {
        item_id,
        price,
        date: new Date().toISOString(),
      },
    ]).select();

    if (error) throw error;
    
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error adding price history:', error);
    return NextResponse.json({ error: 'Failed to add price history' }, { status: 500 });
  }
} 