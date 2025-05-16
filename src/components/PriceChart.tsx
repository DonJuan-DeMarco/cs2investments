'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { InvestmentItem, PriceHistory } from '@/lib/supabase';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type PriceChartProps = {
  investments: InvestmentItem[];
  selectedItem: InvestmentItem | null;
};

export default function PriceChart({ investments, selectedItem }: PriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'individual' | 'total'>('total');

  useEffect(() => {
    if (selectedItem && chartType === 'individual') {
      fetchPriceHistory(selectedItem.id);
    }
  }, [selectedItem, chartType]);

  const fetchPriceHistory = async (itemId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/price-history?itemId=${itemId}`);
      const data = await response.json();
      setPriceHistory(data);
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    if (chartType === 'individual' && selectedItem && priceHistory.length > 0) {
      // Individual item chart
      const labels = priceHistory.map(entry => format(new Date(entry.date), 'MMM d, yyyy'));
      const prices = priceHistory.map(entry => entry.price);
      
      return {
        labels,
        datasets: [
          {
            label: selectedItem.name,
            data: prices,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
          },
        ],
      };
    } else {
      // Total investment chart
      const dataMap = new Map<string, number>();
      
      investments.forEach(item => {
        const date = format(new Date(item.purchase_date), 'MMM d, yyyy');
        const currentValue = dataMap.get(date) || 0;
        dataMap.set(date, currentValue + item.total_investment);
      });
      
      // Sort dates chronologically
      const sortedDates = Array.from(dataMap.keys()).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
      );
      
      // Calculate cumulative investment over time
      let cumulative = 0;
      const cumulativeData = sortedDates.map(date => {
        cumulative += dataMap.get(date) || 0;
        return cumulative;
      });
      
      // Calculate current value at each point
      const currentValueData = cumulativeData.map((investment, index) => {
        const ratio = calculateTotalCurrentValue() / calculateTotalInvestment();
        return investment * ratio;
      });
      
      return {
        labels: sortedDates,
        datasets: [
          {
            label: 'Total Investment',
            data: cumulativeData,
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            tension: 0.1,
          },
          {
            label: 'Current Value',
            data: currentValueData,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            tension: 0.1,
          },
        ],
      };
    }
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: chartType === 'individual' && selectedItem 
          ? `Price History for ${selectedItem.name}` 
          : 'Total Investment Value Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const calculateTotalInvestment = (): number => {
    return investments.reduce((total, item) => total + item.total_investment, 0);
  };

  const calculateTotalCurrentValue = (): number => {
    return investments.reduce((total, item) => total + item.total_current_value, 0);
  };

  if (investments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md h-96 flex items-center justify-center">
        <p className="text-gray-500">No investment data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-semibold text-gray-800">
          {chartType === 'individual' && selectedItem 
            ? `Price History for ${selectedItem.name}` 
            : 'Total Investment Value'}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setChartType('total')}
            className={`px-3 py-1 rounded-md ${
              chartType === 'total'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setChartType('individual')}
            className={`px-3 py-1 rounded-md ${
              chartType === 'individual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
            disabled={!selectedItem}
          >
            Individual
          </button>
        </div>
      </div>
      
      <div className="h-96">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-gray-500">Loading chart data...</p>
          </div>
        ) : (
          <Line data={formatChartData()} options={chartOptions} />
        )}
      </div>
    </div>
  );
} 