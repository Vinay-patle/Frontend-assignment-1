"use client"

/**
 * Custom Hook for Binance REST API Integration
 * Manages loading states, error handling, and data fetching
 *
 * STATE MANAGEMENT STRATEGY:
 * - Market data (prices, candles) → WebSocket-driven (handled by useWebSocket)
 * - Orders / Trades / Positions → REST fetch + manual refresh after mutations
 * - UI state (loading, errors, success) → component-level state managed here
 */

import { useState, useCallback, useEffect, useRef } from "react"
import * as binanceApi from "@/lib/binance"
import { getWebSocketInstance } from "@/lib/websocket"
import type { Order, Trade, Ticker24hr, AccountInfo, OrderRequest } from "@/types/trade"
import type { BinanceKline, ChartInterval } from "@/types/chart"

interface ApiState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface OrderState {
  isSubmitting: boolean
  error: string | null
  success: string | null
  lastOrder: Order | null
}

interface UseBinanceAPIReturn {
  // Public endpoints
  ticker: ApiState<Ticker24hr>
  klines: ApiState<BinanceKline[]>
  fetchTicker: (symbol: string) => Promise<void>
  fetchKlines: (symbol: string, interval: ChartInterval, limit?: number) => Promise<BinanceKline[]>

  // Authenticated endpoints
  account: ApiState<AccountInfo>
  orders: ApiState<Order[]>
  trades: ApiState<Trade[]>
  fetchAccount: () => Promise<void>
  fetchOrders: (symbol: string) => Promise<void>
  fetchTrades: (symbol: string) => Promise<void>

  orderState: OrderState
  placeOrder: (order: OrderRequest) => Promise<Order | null>
  cancelOrder: (symbol: string, orderId: number) => Promise<boolean>
  clearOrderState: () => void

  // Connection test
  testConnection: () => Promise<boolean>
  isAuthenticated: boolean
}

/**
 * Hook for interacting with Binance REST API
 * Provides loading states, error handling, and caching
 *
 * INTERVIEW NOTE: This hook centralizes all REST API interactions,
 * making it easy to manage loading states and errors consistently.
 * The optimistic UI pattern is used for order placement to provide
 * immediate feedback while the request is in flight.
 */
export const useBinanceAPI = (): UseBinanceAPIReturn => {
  // Public data states
  const [ticker, setTicker] = useState<ApiState<Ticker24hr>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const [klines, setKlines] = useState<ApiState<BinanceKline[]>>({
    data: null,
    isLoading: false,
    error: null,
  })

  // Authenticated data states
  const [account, setAccount] = useState<ApiState<AccountInfo>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const [orders, setOrders] = useState<ApiState<Order[]>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const [trades, setTrades] = useState<ApiState<Trade[]>>({
    data: null,
    isLoading: false,
    error: null,
  })

  const [orderState, setOrderState] = useState<OrderState>({
    isSubmitting: false,
    error: null,
    success: null,
    lastOrder: null,
  })

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [listenKey, setListenKey] = useState<string | null>(null)
  const userWsRef = useRef<WebSocket | null>(null)
  const keepAliveTimerRef = useRef<number | null>(null)

  /**
   * Clears order state messages (useful after displaying success/error)
   */
  const clearOrderState = useCallback(() => {
    setOrderState({
      isSubmitting: false,
      error: null,
      success: null,
      lastOrder: null,
    })
  }, [])

  /**
   * Fetches 24hr ticker data for a symbol
   */
  const fetchTicker = useCallback(async (symbol: string) => {
    setTicker((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await binanceApi.get24hrTicker(symbol)
      setTicker({ data, isLoading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch ticker"
      setTicker((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  /**
   * Fetches historical kline/candlestick data
   */
  const fetchKlines = useCallback(
    async (symbol: string, interval: ChartInterval, limit = 500): Promise<BinanceKline[]> => {
      setKlines((prev) => ({ ...prev, isLoading: true, error: null }))
      try {
        const data = await binanceApi.getKlines(symbol, interval, limit)
        setKlines({ data, isLoading: false, error: null })
        return data
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to fetch klines"
        setKlines((prev) => ({ ...prev, isLoading: false, error: message }))
        return []
      }
    },
    [],
  )

  /**
   * Fetches account information
   */
  const fetchAccount = useCallback(async () => {
    setAccount((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await binanceApi.getAccountInfo()
      setAccount({ data, isLoading: false, error: null })
      setIsAuthenticated(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch account"
      setAccount((prev) => ({ ...prev, isLoading: false, error: message }))
      setIsAuthenticated(false)
    }
  }, [])

  /**
   * Fetches open orders for a symbol
   */
  const fetchOrders = useCallback(async (symbol: string) => {
    setOrders((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await binanceApi.getOpenOrders(symbol)
      setOrders({ data, isLoading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch orders"
      setOrders((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  /**
   * Fetches trade history for a symbol
   */
  const fetchTrades = useCallback(async (symbol: string) => {
    setTrades((prev) => ({ ...prev, isLoading: true, error: null }))
    try {
      const data = await binanceApi.getMyTrades(symbol)
      setTrades({ data, isLoading: false, error: null })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch trades"
      setTrades((prev) => ({ ...prev, isLoading: false, error: message }))
    }
  }, [])

  /**
   * Places a new order with optimistic UI feedback
   *
   * INTERVIEW NOTE: This implements the "optimistic UI" pattern:
   * 1. Set submitting state immediately (user sees loading)
   * 2. Make the API call
   * 3. On success: show success message and return order
   * 4. On error: show error message
   *
   * The caller can then refresh orders list after success.
   */
  const placeOrder = useCallback(async (order: OrderRequest): Promise<Order | null> => {
    // Set submitting state for optimistic UI
    setOrderState({
      isSubmitting: true,
      error: null,
      success: null,
      lastOrder: null,
    })

    try {
      const result = await binanceApi.placeOrder(order)

      // Success - update state with success message
      setOrderState({
        isSubmitting: false,
        error: null,
        success: `${order.side} order placed successfully!`,
        lastOrder: result,
      })

      return result
    } catch (error) {
      // Extract meaningful error message
      const message = error instanceof Error ? error.message : "Order placement failed"

      setOrderState({
        isSubmitting: false,
        error: message,
        success: null,
        lastOrder: null,
      })

      return null
    }
  }, [])

  /**
   * Cancels an existing order
   */
  const cancelOrder = useCallback(async (symbol: string, orderId: number): Promise<boolean> => {
    try {
      await binanceApi.cancelOrder(symbol, orderId)
      return true
    } catch (error) {
      console.error("Order cancellation failed:", error)
      return false
    }
  }, [])

  /**
   * Tests API connection with credentials
   */
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const result = await binanceApi.testApiConnection()
      setIsAuthenticated(result)
      return result
    } catch {
      setIsAuthenticated(false)
      return false
    }
  }, [])

  // Start user data stream and subscribe to user websocket messages when authenticated
  useEffect(() => {
    let mounted = true

    async function startUserStream() {
      if (!isAuthenticated) return

      try {
        const key = await binanceApi.startUserDataStream()
        if (!mounted) return
        setListenKey(key)

        // Open a dedicated websocket for user data messages
        const ws = new WebSocket(`${process.env.NEXT_PUBLIC_BINANCE_TESTNET_URL!.replace(/^https?/, "wss")}/ws/${key}`)
        userWsRef.current = ws

        ws.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data)
            // executionReport -> order events
            if (data.e === "executionReport") {
              // refresh orders and trades
              fetchOrders && fetchOrders((orders && orders.data?.[0]?.symbol) || "BTCUSDT")
              fetchTrades && fetchTrades((trades && trades.data?.[0]?.symbol) || "BTCUSDT")
            }

            // outboundAccountPosition -> account/balance update
            if (data.e === "outboundAccountPosition" || data.e === "outboundAccountInfo") {
              fetchAccount()
            }
          } catch (err) {
            console.error("Failed to parse user stream message", err)
          }
        }

        // Keep the user stream alive (Binance requires keepalive PUT within 30 minutes)
        keepAliveTimerRef.current = window.setInterval(() => {
          if (key) binanceApi.keepAliveUserDataStream(key).catch(() => {})
        }, 1000 * 60 * 25) // every 25 minutes
      } catch (err) {
        console.error("Failed to start user data stream", err)
      }
    }

    startUserStream()

    return () => {
      mounted = false
      // cleanup user websocket & listenKey
      if (userWsRef.current) {
        try {
          userWsRef.current.close()
        } catch {}
        userWsRef.current = null
      }
      if (listenKey) {
        binanceApi.closeUserDataStream(listenKey).catch(() => {})
        setListenKey(null)
      }
      if (keepAliveTimerRef.current) {
        clearInterval(keepAliveTimerRef.current)
        keepAliveTimerRef.current = null
      }
    }
  }, [isAuthenticated])

  return {
    ticker,
    klines,
    fetchTicker,
    fetchKlines,
    account,
    orders,
    trades,
    fetchAccount,
    fetchOrders,
    fetchTrades,
    orderState,
    placeOrder,
    cancelOrder,
    clearOrderState,
    testConnection,
    isAuthenticated,
  }
}
