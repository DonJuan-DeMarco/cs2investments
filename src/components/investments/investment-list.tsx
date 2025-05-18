import { useState } from 'react'
import { Investment } from '@/types/investment'

type InvestmentListProps = {
  investments: Investment[]
  onEdit?: (investment: Investment) => void
  onDelete?: (id: string) => void
}

export function InvestmentList({ investments, onEdit, onDelete }: InvestmentListProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Investment | 'itemName'
    direction: 'asc' | 'desc'
  }>({
    key: 'purchaseDate',
    direction: 'desc',
  })

  const sortedInvestments = [...investments].sort((a, b) => {
    if (sortConfig.key === 'itemName') {
      const aValue = a.item.market_hash_name || a.item.def_name
      const bValue = b.item.market_hash_name || b.item.def_name
      
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    const aValue = a[sortConfig.key]
    const bValue = b[sortConfig.key]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortConfig.direction === 'asc'
        ? aValue - bValue
        : bValue - aValue
    }
    
    return 0
  })

  const handleSort = (key: keyof Investment | 'itemName') => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('itemName')}
            >
              Item
              {sortConfig.key === 'itemName' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('purchaseDate')}
            >
              Purchase Date
              {sortConfig.key === 'purchaseDate' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('purchasePrice')}
            >
              Price
              {sortConfig.key === 'purchasePrice' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th 
              className="p-2 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('quantity')}
            >
              Quantity
              {sortConfig.key === 'quantity' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th className="p-2 text-left">
              Total
            </th>
            {(onEdit || onDelete) && (
              <th className="p-2 text-left">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {sortedInvestments.map((investment) => {
            const itemName = investment.item.market_hash_name || investment.item.def_name
            const totalValue = investment.purchasePrice * investment.quantity
            
            return (
              <tr 
                key={investment.id} 
                className="border-b border-gray-200 hover:bg-gray-50"
              >
                <td className="p-2 flex items-center gap-2">
                  {investment.item.image_url && (
                    <img 
                      src={investment.item.image_url} 
                      alt={itemName}
                      className="w-10 h-10 object-contain"
                    />
                  )}
                  <span>{itemName}</span>
                </td>
                <td className="p-2">
                  {new Date(investment.purchaseDate).toLocaleDateString()}
                </td>
                <td className="p-2">
                  ${investment.purchasePrice.toFixed(2)}
                </td>
                <td className="p-2">
                  {investment.quantity}
                </td>
                <td className="p-2">
                  ${totalValue.toFixed(2)}
                </td>
                {(onEdit || onDelete) && (
                  <td className="p-2">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(investment)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(investment.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            )
          })}
          {sortedInvestments.length === 0 && (
            <tr className="border-b border-gray-200">
              <td colSpan={(onEdit || onDelete) ? 6 : 5} className="p-4 text-center text-gray-500">
                No investments found
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-medium">
            <td className="p-2" colSpan={4}>
              Total Investment Value
            </td>
            <td className="p-2">
              ${investments.reduce((total, inv) => total + (inv.purchasePrice * inv.quantity), 0).toFixed(2)}
            </td>
            {(onEdit || onDelete) && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  )
} 