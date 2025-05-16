import { supabase } from '@/lib/supabase';
import { getItemCurrentPrice } from '@/lib/api';

async function updatePrices() {
  console.log('Starting price update job...');
  
  try {
    // Get all investments
    const { data, error } = await supabase
      .from('investments')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No investments found to update');
      return;
    }
    
    console.log(`Updating prices for ${data.length} investments...`);
    
    // Update each investment's current price
    for (const item of data) {
      try {
        // Get current price from API
        const currentPrice = await getItemCurrentPrice(item.name);
        
        if (currentPrice > 0) {
          const totalCurrentValue = currentPrice * item.quantity;
          
          // Update the investment with new price
          const { error: updateError } = await supabase
            .from('investments')
            .update({
              current_price: currentPrice,
              total_current_value: totalCurrentValue,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);
          
          if (updateError) {
            console.error(`Error updating price for ${item.name}:`, updateError);
          } else {
            console.log(`Updated price for ${item.name}: ${currentPrice}`);
            
            // Add entry to price history
            await supabase
              .from('price_history')
              .insert([
                {
                  item_id: item.id,
                  price: currentPrice,
                }
              ]);
          }
        } else {
          console.log(`Skipping ${item.name} due to invalid price: ${currentPrice}`);
        }
      } catch (itemError) {
        console.error(`Error processing item ${item.name}:`, itemError);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Price update completed successfully');
  } catch (error) {
    console.error('Error updating prices:', error);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  updatePrices()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default updatePrices; 