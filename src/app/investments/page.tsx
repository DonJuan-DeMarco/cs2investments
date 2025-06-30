'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Investment, InvestmentInput, ItemRow } from '@/types/investment'
import { InvestmentList } from '@/components/investments/investment-list'
import { InvestmentChart } from '@/components/investments/investment-chart'
import { AddInvestmentModal } from '@/components/investments/add-investment-modal'
import { getLastPriceUpdate } from '@/lib/price-service'
import { useAuth } from '@/contexts/auth-context'
import { v4 as uuidv4 } from 'uuid'

export default function InvestmentsPage() {
  const [items, setItems] = useState<ItemRow[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentInvestment, setCurrentInvestment] = useState<Investment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalCurrentValue, setTotalCurrentValue] = useState<number>(0)
  const [selectedInvestments, setSelectedInvestments] = useState<string[]>([])
  const [currentPrices, setCurrentPrices] = useState<Record<number, { price: number | null, isLoading: boolean, error: boolean }>>({})
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null)

  const { user } = useAuth()
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('cs_items')
        .select('*')
        .eq('user_id', user.id)
        .order('def_name', { ascending: true })

      if (error) throw error

      if (data) {
        setItems(data)
      }
    } catch (error: any) {
      console.error('Error fetching items:', error)
      setError('Failed to load items. Please try again later.')
    }
  }, [supabase, user])

  const fetchInvestments = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          item:cs_items(*)
        `)
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })

      if (error) throw error

      if (data) {
        const formattedInvestments: Investment[] = data.map(item => ({
          id: item.id,
          itemId: item.item_id,
          item: item.item as unknown as ItemRow,
          purchaseDate: item.purchase_date,
          purchasePrice: item.purchase_price,
          quantity: item.quantity,
          createdAt: item.created_at
        }))

        setInvestments(formattedInvestments)
      }
    } catch (error: any) {
      console.error('Error fetching investments:', error)
      setError('Failed to load investments. Please try again later.')
    } finally {
      setIsLoading(false)
    }
  }, [supabase, user])

  const fetchLastPriceUpdate = useCallback(async () => {
    try {
      const lastUpdate = await getLastPriceUpdate()
      setLastPriceUpdate(lastUpdate)
    } catch (error) {
      console.error('Error fetching last price update:', error)
    }
  }, [])

  useEffect(() => {
    fetchItems()
    fetchInvestments()
    fetchLastPriceUpdate()
  }, [fetchItems, fetchInvestments, fetchLastPriceUpdate])

  const handleAddInvestment = async (data: InvestmentInput) => {
    if (!user) {
      setError('You must be logged in to add investments.')
      return
    }

    try {
      const newInvestment = {
        id: uuidv4(),
        item_id: data.itemId,
        purchase_date: data.purchaseDate,
        purchase_price: data.purchasePrice,
        quantity: data.quantity,
        user_id: user.id,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('investments')
        .insert(newInvestment)

      if (error) throw error

      // Refresh the investments list
      fetchInvestments()
    } catch (error: any) {
      console.error('Error adding investment:', error)
      setError('Failed to add investment. Please try again.')
    }
  }

  const handleEditInvestment = async (data: InvestmentInput) => {
    if (!currentInvestment) return

    try {
      const { error } = await supabase
        .from('investments')
        .update({
          item_id: data.itemId,
          purchase_date: data.purchaseDate,
          purchase_price: data.purchasePrice,
          quantity: data.quantity
        })
        .eq('id', currentInvestment.id)

      if (error) throw error

      // Reset current investment and refresh the list
      setCurrentInvestment(null)
      fetchInvestments()
    } catch (error: any) {
      console.error('Error updating investment:', error)
      setError('Failed to update investment. Please try again.')
    }
  }

  const handleDeleteInvestment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment?')) return

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Refresh the investments list
      fetchInvestments()
    } catch (error: any) {
      console.error('Error deleting investment:', error)
      setError('Failed to delete investment. Please try again.')
    }
  }

  const openAddModal = () => {
    setCurrentInvestment(null)
    setIsModalOpen(true)
  }

  const openEditModal = (investment: Investment) => {
    setCurrentInvestment(investment)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setCurrentInvestment(null)
  }

  const totalInvestmentValue = investments.reduce(
    (total, inv) => total + inv.purchasePrice * inv.quantity,
    0
  )

  // Calculate ROI as percentage
  const portfolioROI = totalInvestmentValue > 0
    ? (((totalCurrentValue / 100) - totalInvestmentValue) / totalInvestmentValue) * 100
    : 0

  // Handle selection/deselection of investments for the chart
  const toggleInvestmentSelection = (id: string) => {
    setSelectedInvestments(prev =>
      prev.includes(id)
        ? prev.filter(invId => invId !== id)
        : [...prev, id]
    )
  }

  // Clear all selections
  const clearInvestmentSelection = () => {
    setSelectedInvestments([])
  }

  // Add a handler for getting current prices from the InvestmentList component
  const handleCurrentPricesUpdate = (prices: Record<number, { price: number | null, isLoading: boolean, error: boolean }>) => {
    setCurrentPrices(prices)
  }

  // Manual price update function
  const handleManualPriceUpdate = async () => {
    setIsUpdatingPrices(true)
    setUpdateMessage(null)
    setError(null)

    try {
      const response = await fetch('/api/manual-update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Server returned ${response.status}`)
      }

      // Show success message
      setUpdateMessage(
        `Price update completed! Updated ${result.results?.success || 0} items ` +
        `(${result.results?.failed || 0} failed, ${result.results?.skipped || 0} skipped)`
      )

      // Refresh investments to get updated prices
      fetchInvestments()

      // Refresh last update time
      fetchLastPriceUpdate()

      // Clear success message after 8 seconds
      setTimeout(() => setUpdateMessage(null), 8000)

    } catch (error: any) {
      console.error('Error updating prices:', error)
      setError(`Failed to update prices: ${error.message}`)
    } finally {
      setIsUpdatingPrices(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investments</h1>
          <p className="mt-2 text-gray-600">
            Track your CS2 item investments and portfolio performance
          </p>
        </div>

        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3 items-end">
          {lastPriceUpdate && (
            <div className="text-sm text-gray-500 mb-2 sm:mb-0">
              Last updated: {new Date(lastPriceUpdate).toLocaleString()}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleManualPriceUpdate}
              disabled={isUpdatingPrices}
              title="Manually fetch latest prices for recent items (updates up to 10 items)"
              className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed"
            >
              {isUpdatingPrices ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Update Prices
                </>
              )}
            </button>
            <button
              onClick={openAddModal}
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Investment
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Investments</h2>
          <p className="mt-2 text-3xl font-bold">{investments.length}</p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Value</h2>
          <p className="mt-2 text-3xl font-bold">${totalInvestmentValue.toFixed(2)}</p>
        </div>

        {/* <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-700">Avg. Investment</h2>
          <p className="mt-2 text-3xl font-bold">
            ${investments.length > 0
              ? (totalInvestmentValue / investments.length).toFixed(2)
              : '0.00'}
          </p>
        </div> */}

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-700">Total Current Value</h2>
          <p className="mt-2 text-3xl font-bold">
            ${(totalCurrentValue / 100).toFixed(2)}
          </p>
        </div>

        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-700">Portfolio ROI</h2>
          <p className="mt-2 text-3xl font-bold">
            {totalCurrentValue > 0 ? (
              <span className={portfolioROI > 0 ? 'text-green-600' : portfolioROI < 0 ? 'text-red-600' : 'text-gray-600'}>
                {portfolioROI > 0 ? '+' : ''}{portfolioROI.toFixed(2)}%
              </span>
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {updateMessage && (
        <div className="mb-4 rounded-md bg-green-50 p-4 text-green-700">
          {updateMessage}
        </div>
      )}

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-2">Loading investments...</span>
        </div>
      ) : (
        <>
          <div className="mb-8 overflow-hidden rounded-lg bg-white shadow">
            {selectedInvestments.length > 0 && (
              <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
                <div>
                  <span className="font-medium">{selectedInvestments.length} items selected</span>
                  <span className="text-sm text-gray-600 ml-2">for chart visualization</span>
                </div>
                <button
                  onClick={clearInvestmentSelection}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear Selection
                </button>
              </div>
            )}
            <InvestmentList
              investments={investments}
              onEdit={openEditModal}
              onDelete={handleDeleteInvestment}
              onCurrentValueChange={setTotalCurrentValue}
              onInvestmentSelect={toggleInvestmentSelection}
              selectedInvestments={selectedInvestments}
              onCurrentPricesUpdate={handleCurrentPricesUpdate}
            />
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-3">Portfolio Performance</h2>
            <p className="text-gray-600 mb-4 text-sm">
              {selectedInvestments.length > 0
                ? `Showing performance for ${selectedInvestments.length} selected items. Select items from the table above to customize this chart.`
                : 'Showing performance for all investments. Select specific items from the table above to customize this chart.'}
            </p>
            <InvestmentChart
              investments={investments}
              currentPrices={currentPrices}
              selectedInvestments={selectedInvestments.length > 0 ? selectedInvestments : undefined}
            />
          </div>
        </>
      )}

      <AddInvestmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={currentInvestment ? handleEditInvestment : handleAddInvestment}
        items={items}
        initialData={currentInvestment
          ? {
            itemId: currentInvestment.itemId,
            purchaseDate: currentInvestment.purchaseDate,
            purchasePrice: currentInvestment.purchasePrice,
            quantity: currentInvestment.quantity
          }
          : undefined
        }
        title={currentInvestment ? 'Edit Investment' : 'Add Investment'}
      />
    </div>
  )
} 