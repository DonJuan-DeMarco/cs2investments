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
    <main className="flex min-h-screen flex-col px-6 py-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CS2 Items</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Add New Item
        </button>
      </div>

      {/* Item List - Using key to force refresh when new items are added */}
      <div key={refreshKey}>
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
    </main>
  )
}
