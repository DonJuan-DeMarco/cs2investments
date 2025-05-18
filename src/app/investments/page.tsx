'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Investment, InvestmentInput, ItemRow } from '@/types/investment'
import { InvestmentList } from '@/components/investments/investment-list'
import { AddInvestmentModal } from '@/components/investments/add-investment-modal'
import { v4 as uuidv4 } from 'uuid'

export default function InvestmentsPage() {
  const [items, setItems] = useState<ItemRow[]>([])
  const [investments, setInvestments] = useState<Investment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentInvestment, setCurrentInvestment] = useState<Investment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [totalCurrentValue, setTotalCurrentValue] = useState<number>(0)

  const supabase = createClient()

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cs_items')
        .select('*')
        .order('def_name', { ascending: true })

      if (error) throw error
      
      if (data) {
        setItems(data)
      }
    } catch (error: any) {
      console.error('Error fetching items:', error)
      setError('Failed to load items. Please try again later.')
    }
  }

  const fetchInvestments = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('investments')
        .select(`
          *,
          item:cs_items(*)
        `)
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
  }

  useEffect(() => {
    fetchItems()
    fetchInvestments()
  }, [])

  const handleAddInvestment = async (data: InvestmentInput) => {
    try {
      const newInvestment = {
        id: uuidv4(),
        item_id: data.itemId,
        purchase_date: data.purchaseDate,
        purchase_price: data.purchasePrice,
        quantity: data.quantity,
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investments</h1>
          <p className="mt-2 text-gray-600">
            Track your CS2 item investments and portfolio performance
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={openAddModal}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add Investment
          </button>
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
        
        <div className="rounded-lg bg-white p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-700">Avg. Investment</h2>
          <p className="mt-2 text-3xl font-bold">
            ${investments.length > 0 
              ? (totalInvestmentValue / investments.length).toFixed(2) 
              : '0.00'}
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

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="ml-2">Loading investments...</span>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <InvestmentList 
            investments={investments}
            onEdit={openEditModal}
            onDelete={handleDeleteInvestment}
            onCurrentValueChange={setTotalCurrentValue}
          />
        </div>
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