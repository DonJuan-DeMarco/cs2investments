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

    let cumulativeInvestment = 0

    sortedInvestments.forEach(investment => {
      const date = new Date(investment.purchaseDate).toISOString().split('T')[0]
      const purchaseValue = investment.purchasePrice * investment.quantity

      // Increment the investment amount
      cumulativeInvestment += purchaseValue

      // Get the current value
      const currentPrice = currentPrices[investment.itemId]?.price || 0
      const currentValue = (currentPrice / 100) * investment.quantity

      // If this date already exists, update the values
      if (dateMap.has(date)) {
        const existing = dateMap.get(date)!
        const newProfit = existing.currentValue + currentValue - cumulativeInvestment
        dateMap.set(date, {
          ...existing,
          investment: cumulativeInvestment,
          currentValue: existing.currentValue + currentValue,
          profit: Math.max(0, newProfit),
          loss: Math.min(0, newProfit)
        })
      } else {
        // Add a new entry
        dateMap.set(date, {
          date,
          investment: cumulativeInvestment,
          currentValue: currentValue,
          profit: Math.max(0, currentValue - cumulativeInvestment),
          loss: Math.min(0, currentValue - cumulativeInvestment)
        })
      }
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
          completeData.push(prevData)
        } else if (prevData) {
          // Fill in with the previous cumulative data
          completeData.push({
            date: dateStr,
            investment: prevData.investment,
            currentValue: prevData.currentValue,
            profit: prevData.profit,
            loss: prevData.loss
          })
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1)
      }

      setChartData(completeData)
    } else {
      // Just use the data we have
      setChartData(Array.from(dateMap.values()))
    }
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
                tickFormatter={formatCurrency}
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
                stroke="#3b82f6"
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
                tickFormatter={formatCurrency}
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