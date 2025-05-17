'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'
import { getAveragePrice } from '@/lib/csfloat'

type CSItem = Database['public']['Tables']['cs_items']['Row']

// Extended item type with price information
interface CSItemWithPrice extends CSItem {
  price?: number | null;
  isPriceLoading?: boolean;
  priceError?: boolean;
}

export function ItemList() {
  const [items, setItems] = useState<CSItemWithPrice[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchItems() {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase.from('cs_items').select('*')
        
        if (error) throw error
        
        // Initialize items with price loading state
        const itemsWithPriceState = data.map(item => ({
          ...item,
          price: null,
          isPriceLoading: true,
          priceError: false
        }));
        
        setItems(itemsWithPriceState)
      } catch (err) {
        console.error("Error fetching items:", err)
        setError('Failed to load items')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchItems()
  }, [])
  
  // Fetch prices for items once they're loaded
  useEffect(() => {
    async function fetchPrices() {
      if (!items) return;
      
      // Process items in parallel with Promise.all
      const updatedItemsPromises = items.map(async (item, index) => {
        if (!item.isPriceLoading) return item; // Skip if already loaded
        
        try {
          // Only query CSFloat if we have the necessary data
          if (item.def_index && (item.min_float !== null || item.max_float !== null)) {
            const price = await getAveragePrice({
              def_index: item.def_index,
              paint_index: item.paint_index || undefined,
              min_float: item.min_float || undefined,
              max_float: item.max_float || undefined,
              category: item.category
            });
            
            return {
              ...item,
              price,
              isPriceLoading: false,
              priceError: false
            };
          }
          
          // If missing required data, mark as not loading but with no price
          return {
            ...item,
            isPriceLoading: false
          };
        } catch (err) {
          console.error(`Error fetching price for item ${item.id}:`, err);
          return {
            ...item,
            isPriceLoading: false,
            priceError: true
          };
        }
      });
      
      const updatedItems = await Promise.all(updatedItemsPromises);
      setItems(updatedItems);
    }
    
    fetchPrices();
  }, [items]);
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    )
  }
  
  if (error) {
    return <div className="text-red-500 py-10">{error}. Please try again later.</div>
  }
  
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No items found. Add your first CS item using the button above.</p>
      </div>
    )
  }

  // Helper function to format price nicely
  const formatPrice = (price: number | null | undefined, isLoading: boolean = false, hasError: boolean = false) => {
    if (isLoading) return <span className="text-gray-400">Loading price...</span>;
    if (hasError) return <span className="text-red-400">Error fetching price</span>;
    if (price === null || price === undefined) return <span className="text-gray-400">No price data</span>;
    
    // Format price with currency symbol and 2 decimal places
    return <span className="font-medium text-green-600">${price.toFixed(2)}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Image</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Def Index</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Def Name</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Paint</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Wear</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Category</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Market Hash</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50">
              <td className="py-3 px-4">
                {item.image_url ? (
                  <img 
                    src={item.image_url} 
                    alt={item.def_name}
                    className="h-12 w-12 object-contain" 
                  />
                ) : (
                  <div className="h-12 w-12 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No image</span>
                  </div>
                )}
              </td>
              <td className="py-3 px-4">{item.def_index}</td>
              <td className="py-3 px-4">{item.def_name}</td>
              <td className="py-3 px-4">
                {item.paint_index ? (
                  <span>
                    {item.paint_index} {item.paint_name && `(${item.paint_name})`}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                {item.min_float !== null || item.max_float !== null ? (
                  <span className={getSingleWearCategory(item.min_float, item.max_float).colorClass}>
                    {getSingleWearCategory(item.min_float, item.max_float).label}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="py-3 px-4">
                {getCategoryLabel(item.category)}
              </td>
              <td className="py-3 px-4">
                {item.market_hash_name || <span className="text-gray-400">-</span>}
              </td>
              <td className="py-3 px-4">
                {formatPrice(item.price, item.isPriceLoading, item.priceError)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function getCategoryLabel(category: number): string {
  switch (category) {
    case 0: return "Weapon"
    case 1: return "Knife"
    case 2: return "Glove"
    case 3: return "Other"
    default: return "Unknown"
  }
}

// Function to get wear category based on float value
function getWearCategory(floatValue: number | null): { label: string; colorClass: string } {
  if (floatValue === null) return { label: '?', colorClass: 'text-gray-500' };
  
  if (floatValue < 0.07) return { label: 'FN', colorClass: 'text-green-500 font-medium' };
  if (floatValue < 0.15) return { label: 'MW', colorClass: 'text-green-400 font-medium' };
  if (floatValue < 0.38) return { label: 'FT', colorClass: 'text-yellow-500 font-medium' };
  if (floatValue < 0.45) return { label: 'WW', colorClass: 'text-orange-500 font-medium' };
  return { label: 'BS', colorClass: 'text-red-500 font-medium' };
}

// Function to get a single wear category for a float range
function getSingleWearCategory(minFloat: number | null, maxFloat: number | null): { label: string; colorClass: string } {
  // If we have a min float, use that to determine the category
  if (minFloat !== null) {
    return getWearCategory(minFloat);
  }
  // If only max float is available, use that
  else if (maxFloat !== null) {
    return getWearCategory(maxFloat);
  }
  // Fallback if neither is available
  return { label: '?', colorClass: 'text-gray-500' };
} 