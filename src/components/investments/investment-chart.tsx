import { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  Bar
} from 'recharts'
import { Investment } from '@/types/investment'
import { formatPrice } from '@/lib/utils'

interface ChartData {
  date: string
  investment: number
  currentValue: number
  profit: number
  loss: number
}

type InvestmentChartProps = {
  investments: Investment[]
  currentPrices: Record<number, { price: number | null, isLoading: boolean, error: boolean }>
  selectedInvestments?: string[] // Investment IDs to include, if empty show all
}

export function InvestmentChart({
  investments,
  currentPrices,
  selectedInvestments = []
}: InvestmentChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [view, setView] = useState<'value' | 'profit'>('value')

  // Use refs to track if we need to recalculate
  const prevInvestmentsRef = useRef<string>('')
  const prevPricesRef = useRef<string>('')
  const prevSelectedRef = useRef<string>('')

  useEffect(() => {
    // Create string representations of our dependencies for comparison
    const investmentsKey = JSON.stringify(investments.map(i => i.id))
    const pricesKey = JSON.stringify(Object.entries(currentPrices).map(([id, data]) =>
      `${id}:${data.price}:${data.isLoading}:${data.error}`
    ))
    const selectedKey = JSON.stringify(selectedInvestments)

    // Skip calculation if nothing has changed
    if (
      investmentsKey === prevInvestmentsRef.current &&
      pricesKey === prevPricesRef.current &&
      selectedKey === prevSelectedRef.current
    ) {
      return
    }

    // Update refs with current values
    prevInvestmentsRef.current = investmentsKey
    prevPricesRef.current = pricesKey
    prevSelectedRef.current = selectedKey

    // Filter investments if needed
    const filteredInvestments = selectedInvestments.length > 0
      ? investments.filter(inv => selectedInvestments.includes(inv.id))
      : investments

    // Create a date-based map for chart data
    const dateMap = new Map<string, ChartData>()

    // Sort investments by date (ascending)
    const sortedInvestments = [...filteredInvestments].sort(
      (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
    )

    // Build initial data points for each purchase date
    sortedInvestments.forEach(investment => {
      const date = new Date(investment.purchaseDate).toISOString().split('T')[0]

      // Calculate cumulative values up to and including this date
      let cumulativeInvestment = 0
      let cumulativeCurrentValue = 0

      sortedInvestments.forEach(inv => {
        const invDate = new Date(inv.purchaseDate).toISOString().split('T')[0]
        if (invDate <= date) {
          cumulativeInvestment += inv.purchasePrice * inv.quantity
          const currentPrice = currentPrices[inv.itemId]?.price || 0
          cumulativeCurrentValue += (currentPrice / 100) * inv.quantity
        }
      })

      // Set the data for this date (will overwrite if multiple investments on same date)
      dateMap.set(date, {
        date,
        investment: cumulativeInvestment,
        currentValue: cumulativeCurrentValue,
        profit: Math.max(0, cumulativeCurrentValue - cumulativeInvestment),
        loss: Math.min(0, cumulativeCurrentValue - cumulativeInvestment)
      })
    })

    // Fill in the dates between purchase dates to create a smooth chart
    const allDates = Array.from(dateMap.keys()).sort()
    if (allDates.length > 1) {
      const startDate = new Date(allDates[0])
      const endDate = new Date()

      let currentDate = new Date(startDate)
      let prevData: ChartData | null = null

      const completeData: ChartData[] = []

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0]

        if (dateMap.has(dateStr)) {
          // Use the actual data for this date
          prevData = dateMap.get(dateStr)!

          // Recalculate current value for this date based on ALL investments up to this point
          let totalCurrentValue = 0
          let totalInvestment = 0

          sortedInvestments.forEach(investment => {
            const investmentDate = new Date(investment.purchaseDate).toISOString().split('T')[0]
            if (investmentDate <= dateStr) {
              totalInvestment += investment.purchasePrice * investment.quantity
              const currentPrice = currentPrices[investment.itemId]?.price || 0
              totalCurrentValue += (currentPrice / 100) * investment.quantity
            }
          })

          const updatedData = {
            ...prevData,
            investment: totalInvestment,
            currentValue: totalCurrentValue,
            profit: Math.max(0, totalCurrentValue - totalInvestment),
            loss: Math.min(0, totalCurrentValue - totalInvestment)
          }

          prevData = updatedData
          completeData.push(updatedData)
        } else if (prevData) {
          // Fill in with recalculated current value for this date
          let totalCurrentValue = 0
          let totalInvestment = 0

          sortedInvestments.forEach(investment => {
            const investmentDate = new Date(investment.purchaseDate).toISOString().split('T')[0]
            if (investmentDate <= dateStr) {
              totalInvestment += investment.purchasePrice * investment.quantity
              const currentPrice = currentPrices[investment.itemId]?.price || 0
              totalCurrentValue += (currentPrice / 100) * investment.quantity
            }
          })

          const filledData = {
            date: dateStr,
            investment: totalInvestment,
            currentValue: totalCurrentValue,
            profit: Math.max(0, totalCurrentValue - totalInvestment),
            loss: Math.min(0, totalCurrentValue - totalInvestment)
          }

          completeData.push(filledData)
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      setChartData(completeData)
    } else {
      // Just use the data we have, but recalculate current values
      const recalculatedData = Array.from(dateMap.values()).map(data => {
        let totalCurrentValue = 0
        let totalInvestment = 0

        sortedInvestments.forEach(investment => {
          const investmentDate = new Date(investment.purchaseDate).toISOString().split('T')[0]
          if (investmentDate <= data.date) {
            totalInvestment += investment.purchasePrice * investment.quantity
            const currentPrice = currentPrices[investment.itemId]?.price || 0
            totalCurrentValue += (currentPrice / 100) * investment.quantity
          }
        })

        return {
          ...data,
          investment: totalInvestment,
          currentValue: totalCurrentValue,
          profit: Math.max(0, totalCurrentValue - totalInvestment),
          loss: Math.min(0, totalCurrentValue - totalInvestment)
        }
      })

      setChartData(recalculatedData)
    }

    // Debug logging to help troubleshoot
    console.log('Chart Debug Info:', {
      filteredInvestments: filteredInvestments.length,
      currentPricesAvailable: Object.keys(currentPrices).length,
      chartDataPoints: chartData.length,
      samplePrices: Object.entries(currentPrices).slice(0, 3),
      lastDataPoint: chartData[chartData.length - 1]
    })
  }, [investments, currentPrices, selectedInvestments])

  // Format the date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // If we have no data, show a placeholder
  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-white rounded-lg p-4 shadow">
        <p className="text-gray-500">No data available for chart</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-700">Portfolio Performance</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setView('value')}
            className={`px-3 py-1 rounded text-sm ${view === 'value'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
              }`}
          >
            Value
          </button>
          <button
            onClick={() => setView('profit')}
            className={`px-3 py-1 rounded text-sm ${view === 'profit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
              }`}
          >
            Profit
          </button>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {view === 'value' ? (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                minTickGap={50}
              />
              <YAxis
                tickFormatter={formatPrice}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={formatDate}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="investment"
                fill="#f3f4f6"
                stroke="#9ca3af"
                name="Investment"
              />
              <Line
                type="monotone"
                dataKey="currentValue"
                stroke="#10b981"
                strokeWidth={3}
                name="Current Value"
                dot={false}
              />
            </ComposedChart>
          ) : (
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                minTickGap={50}
              />
              <YAxis
                tickFormatter={formatPrice}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                labelFormatter={formatDate}
              />
              <Legend />
              <Bar
                dataKey="profit"
                fill="#10b981"
                name="Profit"
                stackId="profit"
                isAnimationActive={false}
              />
              <Bar
                dataKey="loss"
                fill="#ef4444"
                name="Loss"
                stackId="profit"
                isAnimationActive={false}
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
} 