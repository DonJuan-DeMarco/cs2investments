'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { formatPrice } from '@/lib/api';

type Item = {
  id: string;
  name: string;
  market_hash_name?: string;
  image_url: string;
  price: number;
};

type AddItemModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: any) => void;
};

export default function AddItemModal({ isOpen, onClose, onAddItem }: AddItemModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<number | string>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/items/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      // Normalize data to consistent format
      const normalizedData = data.map((item: any) => ({
        id: item.id || item.asset_id || Date.now().toString(),
        name: item.name || item.market_hash_name || 'Unknown Item',
        market_hash_name: item.market_hash_name,
        image_url: item.image_url || item.icon_url || '/placeholder.png',
        price: item.price || item.lowest_price || 0,
      }));
      
      setSearchResults(normalizedData);
    } catch (error) {
      console.error('Error searching for items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (item: Item) => {
    setSelectedItem(item);
    setPurchasePrice(item.price);
  };

  const handleSubmit = () => {
    if (!selectedItem || !purchasePrice || !quantity || !purchaseDate) {
      return;
    }

    const newItem = {
      name: selectedItem.name || selectedItem.market_hash_name,
      image_url: selectedItem.image_url,
      purchase_price: Number(purchasePrice),
      quantity: Number(quantity),
      purchase_date: purchaseDate,
    };

    onAddItem(newItem);
    resetForm();
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
    setQuantity(1);
    setPurchasePrice('');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 mb-4"
                >
                  Add New Investment
                </Dialog.Title>

                <div className="mt-4 space-y-6">
                  {/* Search section */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Search for CS2 Items
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Search for items (e.g. AWP Asiimov)"
                      />
                      <button
                        type="button"
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {isLoading ? 'Searching...' : 'Search'}
                      </button>
                    </div>
                  </div>

                  {/* Search results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Select an item
                      </label>
                      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                        <ul className="divide-y divide-gray-200">
                          {searchResults.map((item) => (
                            <li
                              key={item.id}
                              className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${
                                selectedItem?.id === item.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => handleSelectItem(item)}
                            >
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-md"
                                  src={item.image_url}
                                  alt={item.name}
                                />
                              </div>
                              <div className="ml-4 flex-1">
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">
                                  {formatPrice(item.price)}
                                </div>
                              </div>
                              {selectedItem?.id === item.id && (
                                <div className="ml-2 text-blue-600">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Item details */}
                  {selectedItem && (
                    <div className="space-y-4">
                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Investment Details
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="purchase-price"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Purchase Price
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="purchase-price"
                              value={purchasePrice}
                              onChange={(e) => setPurchasePrice(e.target.value)}
                              step="0.01"
                              min="0"
                              className="block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="quantity"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Quantity
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="quantity"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              min="1"
                              className="block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div className="col-span-2">
                          <label
                            htmlFor="purchase-date"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Purchase Date
                          </label>
                          <div className="mt-1">
                            <input
                              type="date"
                              id="purchase-date"
                              value={purchaseDate}
                              onChange={(e) => setPurchaseDate(e.target.value)}
                              className="block w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 bg-gray-50 px-4 py-3 rounded-md">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-700">Total Investment:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatPrice(Number(purchasePrice) * quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!selectedItem || !purchasePrice || quantity < 1}
                      className={`inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        !selectedItem || !purchasePrice || quantity < 1
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      Add Investment
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 