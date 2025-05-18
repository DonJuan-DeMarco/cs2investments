'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { AddItemForm } from '@/components/forms/add-item-form'
import { ItemList } from '@/components/items/item-list'

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleAddSuccess = () => {
    setIsModalOpen(false)
    setRefreshKey(prev => prev + 1) // Force refresh of ItemList
  }

  return (
    <div>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">CS2 Items</h1>
          <p className="mt-2 text-gray-600">
            Manage your CS2 items inventory and data
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Add New Item
          </button>
        </div>
      </div>

      {/* Item List - Using key to force refresh when new items are added */}
      <div key={refreshKey} className="overflow-hidden rounded-lg bg-white shadow">
        <ItemList />
      </div>

      {/* Add Item Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="Add New CS2 Item"
      >
        <AddItemForm onSuccess={handleAddSuccess} />
      </Modal>
    </div>
  )
}
