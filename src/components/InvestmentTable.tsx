'use client';

import { useState } from 'react';
import { InvestmentItem } from '@/lib/supabase';
import { formatPrice } from '@/lib/api';
import { format } from 'date-fns';

type InvestmentTableProps = {
  investments: InvestmentItem[];
  onSelectItem: (item: InvestmentItem) => void;
};

export default function InvestmentTable({ investments, onSelectItem }: InvestmentTableProps) {
  const [sortField, setSortField] = useState<keyof InvestmentItem>('purchase_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof InvestmentItem) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedInvestments = [...investments].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const calculateTotalInvestment = (): number => {
    return investments.reduce((total, item) => total + item.total_investment, 0);
  };

  const calculateTotalCurrentValue = (): number => {
    return investments.reduce((total, item) => total + item.total_current_value, 0);
  };

  const calculateTotalProfit = (): number => {
    return calculateTotalCurrentValue() - calculateTotalInvestment();
  };

  const getRowClass = (item: InvestmentItem): string => {
    const profit = item.total_current_value - item.total_investment;
    return profit >= 0 ? 'bg-green-50' : 'bg-red-50';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-md">
      <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900">Item</th>
            <th 
              scope="col" 
              className="px-6 py-4 font-medium text-gray-900 cursor-pointer"
              onClick={() => handleSort('purchase_date')}
            >
              Purchase Date
              {sortField === 'purchase_date' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 font-medium text-gray-900 cursor-pointer"
              onClick={() => handleSort('purchase_price')}
            >
              Purchase Price
              {sortField === 'purchase_price' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 font-medium text-gray-900 cursor-pointer"
              onClick={() => handleSort('current_price')}
            >
              Current Price
              {sortField === 'current_price' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900">Quantity</th>
            <th 
              scope="col" 
              className="px-6 py-4 font-medium text-gray-900 cursor-pointer"
              onClick={() => handleSort('total_investment')}
            >
              Total Investment
              {sortField === 'total_investment' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th 
              scope="col" 
              className="px-6 py-4 font-medium text-gray-900 cursor-pointer"
              onClick={() => handleSort('total_current_value')}
            >
              Current Value
              {sortField === 'total_current_value' && (
                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
              )}
            </th>
            <th scope="col" className="px-6 py-4 font-medium text-gray-900">Profit/Loss</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 border-t border-gray-100">
          {sortedInvestments.map((item) => (
            <tr 
              key={item.id} 
              className={`hover:bg-gray-100 cursor-pointer ${getRowClass(item)}`}
              onClick={() => onSelectItem(item)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    <img className="h-10 w-10 rounded-md" src={item.image_url} alt={item.name} />
                  </div>
                  <div className="ml-4">
                    <div className="font-medium text-gray-900">{item.name}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                {format(new Date(item.purchase_date), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4">{formatPrice(item.purchase_price)}</td>
              <td className="px-6 py-4">{formatPrice(item.current_price)}</td>
              <td className="px-6 py-4">{item.quantity}</td>
              <td className="px-6 py-4">{formatPrice(item.total_investment)}</td>
              <td className="px-6 py-4">{formatPrice(item.total_current_value)}</td>
              <td className={`px-6 py-4 font-medium ${item.total_current_value >= item.total_investment ? 'text-green-600' : 'text-red-600'}`}>
                {formatPrice(item.total_current_value - item.total_investment)}
                <span className="ml-1">
                  ({Math.round((item.total_current_value / item.total_investment - 1) * 100)}%)
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 font-medium text-gray-900">
          <tr>
            <td colSpan={5} className="px-6 py-4 text-right">Totals:</td>
            <td className="px-6 py-4">{formatPrice(calculateTotalInvestment())}</td>
            <td className="px-6 py-4">{formatPrice(calculateTotalCurrentValue())}</td>
            <td className={`px-6 py-4 font-medium ${calculateTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPrice(calculateTotalProfit())}
              <span className="ml-1">
                ({Math.round((calculateTotalCurrentValue() / calculateTotalInvestment() - 1) * 100)}%)
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
} 