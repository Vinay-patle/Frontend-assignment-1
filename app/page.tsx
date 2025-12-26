/**
 * Main Trading Screen
 * Combines all components into a professional trading interface
 *
 * STATE MANAGEMENT STRATEGY:
 * - Market data (prices, candles) → WebSocket-driven via useWebSocket
 * - Orders / Trades → REST fetch + manual refresh after mutations
 * - UI state (tabs, loading) → component-level useState
 *
 * INTERVIEW NOTE: The data flow is unidirectional:
 * 1. WebSocket receives price updates → updates chart + ticker
 * 2. REST API fetches orders/trades on demand
 * 3. After placing/canceling orders, we refresh the orders list
 */

"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "@/components/Header/Header"
import TradingChart from "@/components/Chart/TradingChart"
import { OrderPanel } from "@/components/OrderPanel/OrderPanel"
import { PositionsTable } from "@/components/Tables/PositionsTable"
import { OrdersTable } from "@/components/Tables/OrdersTable"
import { TradesTable } from "@/components/Tables/TradesTable"
import { useWebSocket } from "@/hooks/useWebSocket"
import { useBinanceAPI } from "@/hooks/useBinanceAPI"
import type { ChartInterval, CandlestickData, BinanceKline } from "@/types/chart"
import type { Position, OrderRequest } from "@/types/trade"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"

// Default trading pair
const DEFAULT_SYMBOL = "BTCUSDT"
const DEFAULT_INTERVAL: ChartInterval = "1m"

// Available intervals for selection
const INTERVALS: { value: ChartInterval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
]

// Tabs for bottom panel
type TableTab = "positions" | "orders" | "trades"

export default function TradingPage() {
  // Trading pair state
  const [symbol, setSymbol] = useState(DEFAULT_SYMBOL)
  const [interval, setInterval] = useState<ChartInterval>(DEFAULT_INTERVAL)
  const [activeTab, setActiveTab] = useState<TableTab>("orders")

  // Chart data state
  const [historicalData, setHistoricalData] = useState<BinanceKline[]>([])
  const [lastCandle, setLastCandle] = useState<CandlestickData | null>(null)
  const [isChartLoading, setIsChartLoading] = useState(true)

  const [livePrice, setLivePrice] = useState<string>("")

  // Positions placeholder (spot API doesn't have positions, this is for UI demonstration)
  const [positions] = useState<Position[]>([])

  // API hook for REST calls
  const {
    ticker,
    orders,
    trades,
    fetchTicker,
    fetchKlines,
    fetchOrders,
    fetchTrades,
    orderState,
    placeOrder,
    cancelOrder,
    clearOrderState,
    testConnection,
    isAuthenticated,
  } = useBinanceAPI()

  const handleTradeUpdate = useCallback((data: { p: string }) => {
    setLivePrice(data.p)
  }, [])

  // WebSocket hook for real-time data
  const { connectionState } = useWebSocket({
    symbol,
    interval,
    onKlineUpdate: setLastCandle,
    onTradeUpdate: handleTradeUpdate,
  })

  /**
   * Fetches initial data when symbol or interval changes
   */
  const fetchInitialData = useCallback(async () => {
    setIsChartLoading(true)
    setLastCandle(null)

    try {
      // Fetch in parallel
      const [klineData] = await Promise.all([fetchKlines(symbol, interval), fetchTicker(symbol)])

      setHistoricalData(klineData)
    } catch (error) {
      console.error("Failed to fetch initial data:", error)
    } finally {
      setIsChartLoading(false)
    }
  }, [symbol, interval, fetchKlines, fetchTicker])

  /**
   * Fetches authenticated data (orders and trades)
   */
  const fetchAuthData = useCallback(async () => {
    await Promise.all([fetchOrders(symbol), fetchTrades(symbol)])
  }, [symbol, fetchOrders, fetchTrades])

  // Initial data fetch and symbol/interval change handling
  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // Test authentication and fetch auth data on mount
  useEffect(() => {
    testConnection().then((authenticated) => {
      if (authenticated) {
        fetchAuthData()
      }
    })
  }, [testConnection, fetchAuthData])

  // Refresh ticker periodically (backup for WebSocket)
  useEffect(() => {
    const tickerInterval = window.setInterval(() => {
      fetchTicker(symbol)
    }, 10000) // Every 10 seconds

    return () => window.clearInterval(tickerInterval)
  }, [symbol, fetchTicker])

  /**
   * Handles order placement with optimistic UI
   */
  const handlePlaceOrder = async (order: OrderRequest) => {
    const result = await placeOrder(order)
    if (result) {
      // Refresh orders and trades after successful placement
      await Promise.all([fetchOrders(symbol), fetchTrades(symbol)])
    }
  }

  /**
   * Handles order cancellation
   */
  const handleCancelOrder = async (orderSymbol: string, orderId: number) => {
    const success = await cancelOrder(orderSymbol, orderId)
    if (success) {
      await fetchOrders(symbol)
    }
    return success
  }

  /**
   * Handles manual refresh of orders/trades
   */
  const handleRefreshData = async () => {
    if (isAuthenticated) {
      await fetchAuthData()
    }
  }

  /**
   * Formats price change percentage
   */
  const formatPriceChange = () => {
    if (!ticker.data) return { value: "0.00%", isPositive: true }
    const pct = Number.parseFloat(ticker.data.priceChangePercent)
    return {
      value: `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`,
      isPositive: pct >= 0,
    }
  }

  const priceChange = formatPriceChange()
  // Use live WebSocket price, fallback to ticker price
  const displayPrice = livePrice || ticker.data?.lastPrice || ""

  return (
    <div className="min-h-screen bg-trading-bg flex flex-col">
      {/* Header */}
      <Header connectionState={connectionState} symbol={symbol} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-2 gap-2 overflow-hidden">
        {/* Left Panel: Order Entry */}
        <div className="w-full lg:w-72 shrink-0">
          <OrderPanel
            symbol={symbol}
            currentPrice={displayPrice}
            onPlaceOrder={handlePlaceOrder}
            isAuthenticated={isAuthenticated}
            isSubmitting={orderState.isSubmitting}
            orderError={orderState.error}
            orderSuccess={orderState.success}
            onClearMessages={clearOrderState}
          />
        </div>

        {/* Right Panel: Chart and Tables */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {/* Trading Pair Info */}
          <div className="bg-trading-panel rounded-lg p-3 flex flex-wrap items-center gap-4">
            {/* Symbol Selector */}
            <div className="flex items-center gap-2">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-trading-card border border-trading-border rounded px-3 py-1.5 text-trading-text font-medium focus:border-trading-warning focus:outline-none"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
                <option value="BNBUSDT">BNB/USDT</option>
                <option value="SOLUSDT">SOL/USDT</option>
              </select>
            </div>

            {/* Last Price - Now uses live WebSocket price */}
            <div className="flex flex-col">
              <span className="text-xs text-trading-text-muted">Last Price</span>
              <span
                className={`text-lg font-mono font-semibold ${
                  priceChange.isPositive ? "text-trading-buy" : "text-trading-sell"
                }`}
              >
                {displayPrice
                  ? Number.parseFloat(displayPrice).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "—"}
              </span>
            </div>

            {/* 24h Change */}
            <div className="flex flex-col">
              <span className="text-xs text-trading-text-muted">24h Change</span>
              <span
                className={`flex items-center gap-1 font-mono ${
                  priceChange.isPositive ? "text-trading-buy" : "text-trading-sell"
                }`}
              >
                {priceChange.isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {priceChange.value}
              </span>
            </div>

            {/* 24h High */}
            <div className="flex flex-col">
              <span className="text-xs text-trading-text-muted">24h High</span>
              <span className="font-mono text-trading-text">
                {ticker.data?.highPrice
                  ? Number.parseFloat(ticker.data.highPrice).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })
                  : "—"}
              </span>
            </div>

            {/* 24h Low */}
            <div className="flex flex-col">
              <span className="text-xs text-trading-text-muted">24h Low</span>
              <span className="font-mono text-trading-text">
                {ticker.data?.lowPrice
                  ? Number.parseFloat(ticker.data.lowPrice).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })
                  : "—"}
              </span>
            </div>

            {/* 24h Volume */}
            <div className="flex flex-col">
              <span className="text-xs text-trading-text-muted">24h Volume</span>
              <span className="font-mono text-trading-text">
                {ticker.data?.volume
                  ? Number.parseFloat(ticker.data.volume).toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })
                  : "—"}
              </span>
            </div>

            {/* Interval Selector */}
            <div className="ml-auto flex items-center gap-1">
              {INTERVALS.map((int) => (
                <button
                  key={int.value}
                  onClick={() => setInterval(int.value)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    interval === int.value
                      ? "bg-trading-warning text-black"
                      : "bg-trading-card text-trading-text-secondary hover:bg-trading-row-hover"
                  }`}
                >
                  {int.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="flex-1 min-h-100">
            <TradingChart
              symbol={symbol}
              interval={interval}
              historicalData={historicalData}
              lastCandle={lastCandle}
              isLoading={isChartLoading}
            />
          </div>

          {/* Tables Panel */}
          <div className="bg-trading-panel rounded-lg overflow-hidden">
            {/* Tab Headers with Refresh Button */}
            <div className="flex items-center border-b border-trading-border">
              <div className="flex">
                {(["positions", "orders", "trades"] as TableTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                      activeTab === tab
                        ? "text-trading-warning border-b-2 border-trading-warning"
                        : "text-trading-text-secondary hover:text-trading-text"
                    }`}
                  >
                    {tab}
                    {tab === "orders" && orders.data && orders.data.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-trading-warning/20 text-trading-warning text-xs rounded-full">
                        {orders.data.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={handleRefreshData}
                disabled={!isAuthenticated || orders.isLoading || trades.isLoading}
                className="ml-auto mr-2 p-1.5 hover:bg-trading-row-hover rounded transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw
                  className={`h-4 w-4 text-trading-text-muted ${
                    orders.isLoading || trades.isLoading ? "animate-spin" : ""
                  }`}
                />
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-2 max-h-64 overflow-auto">
              {activeTab === "positions" && (
                <PositionsTable positions={positions} isLoading={false} currentPrice={displayPrice} />
              )}
              {activeTab === "orders" && (
                <OrdersTable
                  orders={orders.data || []}
                  isLoading={orders.isLoading}
                  onCancelOrder={handleCancelOrder}
                />
              )}
              {activeTab === "trades" && <TradesTable trades={trades.data || []} isLoading={trades.isLoading} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
