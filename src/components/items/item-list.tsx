'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/supabase'

type CSItem = Database['public']['Tables']['cs_items']['Row']

export function ItemList() {
  const [items, setItems] = useState<CSItem[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    async function fetchItems() {
      try {
        setIsLoading(true)
        const supabase = createClient()
        const { data, error } = await supabase.from('cs_items').select('*')
        
        if (error) throw error
        
        setItems(data)
      } catch (err) {
        console.error("Error fetching items:", err)
        setError('Failed to load items')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchItems()
  }, [])
  
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

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Image</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Def Index</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Def Name</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Paint</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Float Range</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Category</th>
            <th className="py-3 px-4 text-left text-sm font-medium text-gray-700">Market Hash</th>
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
                  <span>
                    {item.min_float !== null ? item.min_float.toFixed(4) : '?'} - {item.max_float !== null ? item.max_float.toFixed(4) : '?'}
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