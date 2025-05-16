'use client';

import { useState, useEffect } from 'react';
import InvestmentTable from '@/components/InvestmentTable';
import PriceChart from '@/components/PriceChart';
import AddItemModal from '@/components/AddItemModal';
import { InvestmentItem } from '@/lib/supabase';

export default function Home() {
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InvestmentItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/investments');
      const data = await response.json();
      setInvestments(data);
    } catch (error) {
      console.error('Error fetching investments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async (newItem: any) => {
    try {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });

      if (response.ok) {
        const addedItem = await response.json();
        setInvestments([addedItem, ...investments]);
        setIsModalOpen(false);
      } else {
        console.error('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">CS2 Investment Tracker</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="-ml-1 mr-2 h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Investment
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading investments...</div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <PriceChart investments={investments} selectedItem={selectedItem} />
            </div>
            
            <div>
              <InvestmentTable
                investments={investments}
                onSelectItem={setSelectedItem}
              />
            </div>
          </>
        )}
      </div>

      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
      />
    </main>
  );
}
