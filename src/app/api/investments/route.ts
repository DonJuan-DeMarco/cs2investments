import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getItemCurrentPrice } from '@/lib/api';

// GET all investments
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .order('purchase_date', { ascending: false });

    if (error) throw error;

    // Update current prices for all items
    const updatedData = await Promise.all(
      data.map(async (item) => {
        const currentPrice = await getItemCurrentPrice(item.name);
        const totalInvestment = item.purchase_price * item.quantity;
        const totalCurrentValue = currentPrice * item.quantity;

        return {
          ...item,
          current_price: currentPrice,
          total_investment: totalInvestment,
          total_current_value: totalCurrentValue,
        };
      })
    );

    return NextResponse.json(updatedData);
  } catch (error) {
    console.error('Error fetching investments:', error);
    return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
  }
}

// POST a new investment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, image_url, purchase_price, quantity, purchase_date } = body;

    if (!name || !purchase_price || !quantity || !purchase_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const currentPrice = await getItemCurrentPrice(name);
    const totalInvestment = purchase_price * quantity;
    const totalCurrentValue = currentPrice * quantity;

    const { data, error } = await supabase.from('investments').insert([
      {
        name,
        image_url,
        purchase_price,
        current_price: currentPrice,
        quantity,
        purchase_date,
        total_investment: totalInvestment,
        total_current_value: totalCurrentValue,
      },
    ]).select();

    if (error) throw error;

    // Also add initial entry to price history
    await supabase.from('price_history').insert([
      {
        item_id: data[0].id,
        price: currentPrice,
        date: new Date().toISOString(),
      },
    ]);

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Error adding investment:', error);
    return NextResponse.json({ error: 'Failed to add investment' }, { status: 500 });
  }
} 