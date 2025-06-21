import { useState, useEffect } from 'react'
import { Investment } from '@/types/investment'
import { getItemPrices, PriceData } from '@/lib/price-service'

type InvestmentListProps = {
  investments: Investment[]
  onEdit?: (investment: Investment) => void
  onDelete?: (id: string) => void
  onCurrentValueChange?: (totalCurrentValue: number) => void
  onInvestmentSelect?: (id: string) => void
  selectedInvestments?: string[]
  onCurrentPricesUpdate?: (prices: Record<number, { price: number | null, isLoading: boolean, error: boolean }>) => void
}

export function InvestmentList({
  investments,
  onEdit,
  onDelete,
  onCurrentValueChange,
  onInvestmentSelect,
  selectedInvestments = [],
  onCurrentPricesUpdate
}: InvestmentListProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Investment | 'itemName' | 'currentPrice' | 'totalCurrentPrice'
    direction: 'asc' | 'desc'
  }>({
    key: 'purchaseDate',
    direction: 'desc',
  })

  const [currentPrices, setCurrentPrices] = useState<Record<number, { price: number | null, isLoading: boolean, error: boolean }>>({})

  // Fetch current prices for all items from database
  useEffect(() => {
    const fetchPrices = async () => {
      // Create a batch of unique item IDs to fetch
      const uniqueItemIds = [...new Set(investments.map(inv => inv.itemId))]

      if (uniqueItemIds.length === 0) return

      // Mark all items as loading
      const loadingState: Record<number, { price: number | null, isLoading: boolean, error: boolean }> = {}
      uniqueItemIds.forEach(itemId => {
        loadingState[itemId] = { price: null, isLoading: true, error: false }
      })
      setCurrentPrices(loadingState)

      try {
        // Fetch all prices at once from database
        const prices = await getItemPrices(uniqueItemIds)

        // Update state with fetched prices
        const updatedPrices: Record<number, { price: number | null, isLoading: boolean, error: boolean }> = {}
        uniqueItemIds.forEach(itemId => {
          const priceData = prices[itemId]
          updatedPrices[itemId] = {
            price: priceData?.price || null,
            isLoading: false,
            error: false
          }
        })

        setCurrentPrices(updatedPrices)
      } catch (err) {
        console.error('Error fetching prices:', err)

        // Mark all as error state
        const errorState: Record<number, { price: number | null, isLoading: boolean, error: boolean }> = {}
        uniqueItemIds.forEach(itemId => {
          errorState[itemId] = { price: null, isLoading: false, error: true }
        })
        setCurrentPrices(errorState)
      }
    }

    fetchPrices()
  }, [investments])

  const sortedInvestments = [...investments].sort((a, b) => {
    if (sortConfig.key === 'itemName') {
      const aValue = a.item.market_hash_name || a.item.def_name
      const bValue = b.item.market_hash_name || b.item.def_name

      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    if (sortConfig.key === 'currentPrice') {
      const aPrice = currentPrices[a.itemId]?.price || 0
      const bPrice = currentPrices[b.itemId]?.price || 0

      return sortConfig.direction === 'asc'
        ? aPrice - bPrice
        : bPrice - aPrice
    }

    if (sortConfig.key === 'totalCurrentPrice') {
      const aTotal = (currentPrices[a.itemId]?.price || 0) * a.quantity
      const bTotal = (currentPrices[b.itemId]?.price || 0) * b.quantity

      return sortConfig.direction === 'asc'
        ? aTotal - bTotal
        : bTotal - aTotal
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

  const handleSort = (key: keyof Investment | 'itemName' | 'currentPrice' | 'totalCurrentPrice') => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    })
  }

  // Calculate total current value
  const totalCurrentValue = investments.reduce((total, inv) => {
    const price = currentPrices[inv.itemId]?.price || 0
    return total + (price * inv.quantity)
  }, 0)

  // Notify parent component when total current value changes
  useEffect(() => {
    if (onCurrentValueChange) {
      onCurrentValueChange(totalCurrentValue)
    }
  }, [totalCurrentValue, onCurrentValueChange])

  // Notify parent component when current prices change
  useEffect(() => {
    if (onCurrentPricesUpdate) {
      onCurrentPricesUpdate(currentPrices)
    }
  }, [currentPrices, onCurrentPricesUpdate])

  // Helper function to render price state
  const renderPriceState = (itemId: number) => {
    const priceState = currentPrices[itemId]

    if (!priceState || priceState.isLoading) {
      return <span className="text-gray-400">Loading...</span>
    }

    if (priceState.error) {
      return <span className="text-red-500">Error</span>
    }

    if (priceState.price === null) {
      return <span className="text-gray-400">No data</span>
    }

    return `$${(priceState.price / 100).toFixed(2)}`
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            {onInvestmentSelect && (
              <th className="p-2 w-10"></th>
            )}
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
              Purchase Price
              {sortConfig.key === 'purchasePrice' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
            </th>
            <th
              className="p-2 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('currentPrice')}
            >
              Current Price
              {sortConfig.key === 'currentPrice' && (
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
              Total Purchase
            </th>
            <th
              className="p-2 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('totalCurrentPrice')}
            >
              Total Current
              {sortConfig.key === 'totalCurrentPrice' && (
                <span className="ml-1">
                  {sortConfig.direction === 'asc' ? '↑' : '↓'}
                </span>
              )}
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
            const totalPurchaseValue = investment.purchasePrice * investment.quantity
            const currentPrice = currentPrices[investment.itemId]?.price || 0
            const totalCurrentValue = currentPrice * investment.quantity
            const priceDifference = currentPrice - (investment.purchasePrice * 100) // Convert purchase price to cents for comparison
            const percentChange = investment.purchasePrice > 0 ? (priceDifference / (investment.purchasePrice * 100)) * 100 : 0

            return (
              <tr
                key={investment.id}
                className={`border-b border-gray-200 hover:bg-gray-50 ${selectedInvestments.includes(investment.id) ? 'bg-blue-50' : ''
                  }`}
                onClick={() => onInvestmentSelect && onInvestmentSelect(investment.id)}
              >
                {onInvestmentSelect && (
                  <td className="p-2 w-10">
                    <input
                      type="checkbox"
                      checked={selectedInvestments.includes(investment.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        onInvestmentSelect(investment.id)
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                )}
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
                  {renderPriceState(investment.itemId)}
                </td>
                <td className="p-2">
                  {investment.quantity}
                </td>
                <td className="p-2">
                  ${totalPurchaseValue.toFixed(2)}
                </td>
                <td className="p-2">
                  {currentPrices[investment.itemId]?.price !== null ? (
                    <div className="flex flex-col">
                      <span>${(totalCurrentValue / 100).toFixed(2)}</span>
                      <span className={`text-xs ${percentChange > 0 ? 'text-green-600' : percentChange < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {percentChange > 0 ? '▲' : percentChange < 0 ? '▼' : '●'}
                        {percentChange.toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">No data</span>
                  )}
                </td>
                {(onEdit || onDelete) && (
                  <td className="p-2">
                    <div className="flex gap-2">
                      {onEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(investment)
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(investment.id)
                          }}
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
              <td colSpan={(onEdit || onDelete) ? (onInvestmentSelect ? 9 : 8) : (onInvestmentSelect ? 8 : 7)} className="p-4 text-center text-gray-500">
                No investments found
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50 font-medium">
            <td className="p-2" colSpan={onInvestmentSelect ? 6 : 5}>
              Total Investment Value
            </td>
            <td className="p-2">
              ${investments.reduce((total, inv) => total + (inv.purchasePrice * inv.quantity), 0).toFixed(2)}
            </td>
            <td className="p-2">
              ${(totalCurrentValue / 100).toFixed(2)}
            </td>
            {(onEdit || onDelete) && <td></td>}
          </tr>
        </tfoot>
      </table>
    </div>
  )
} 