import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { ItemRow } from '@/types/investment'
import { InvestmentInput } from '@/types/investment'

type AddInvestmentModalProps = {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InvestmentInput) => void
  items: ItemRow[]
  initialData?: InvestmentInput
  title?: string
}

export function AddInvestmentModal({
  isOpen,
  onClose,
  onSubmit,
  items,
  initialData,
  title = 'Add Investment'
}: AddInvestmentModalProps) {
  const [formData, setFormData] = useState<InvestmentInput>({
    itemId: 0,
    purchaseDate: new Date().toISOString().split('T')[0],
    purchasePrice: 0,
    quantity: 1
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredItems, setFilteredItems] = useState<ItemRow[]>(items)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
    } else {
      setFormData({
        itemId: items.length > 0 ? items[0].id : 0,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchasePrice: 0,
        quantity: 1
      })
    }
  }, [initialData, items])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredItems(items)
    } else {
      const normalized = searchTerm.toLowerCase()
      setFilteredItems(
        items.filter(item => {
          const itemName = (item.market_hash_name || item.def_name).toLowerCase()
          return itemName.includes(normalized)
        })
      )
    }
  }, [searchTerm, items])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Search Item
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for an item..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="itemId" className="block text-sm font-medium mb-1">
            Select Item
          </label>
          <select
            id="itemId"
            name="itemId"
            value={formData.itemId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          >
            {filteredItems.length === 0 ? (
              <option value="">No items found</option>
            ) : (
              filteredItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.market_hash_name || item.def_name}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium mb-1">
            Purchase Date
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={formData.purchaseDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium mb-1">
            Purchase Price ($)
          </label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={formData.purchasePrice}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium mb-1">
            Quantity
          </label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            {initialData ? 'Update' : 'Add'} Investment
          </button>
        </div>
      </form>
    </Modal>
  )
} 