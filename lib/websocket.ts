/**
 * WebSocket Helper Functions and Parsers
 * Manages real-time data streams from Binance
 */

import type { BinanceKlineWS, ChartInterval, CandlestickData } from "@/types/chart"
import type { TradeStreamData } from "@/types/trade"

// Binance Testnet WebSocket base URL
const WS_BASE_URL = "wss://testnet.binance.vision/ws"

/** WebSocket connection state */
export type ConnectionState = "connecting" | "connected" | "disconnected" | "error"

/** WebSocket message handler types */
export type KlineHandler = (data: CandlestickData) => void
export type TradeHandler = (data: TradeStreamData) => void
export type ConnectionHandler = (state: ConnectionState) => void

/**
 * Creates a WebSocket URL for specific streams
 */
export const createStreamUrl = (streams: string[]): string => {
  if (streams.length === 1) {
    return `${WS_BASE_URL}/${streams[0]}`
  }
  return `${WS_BASE_URL}/stream?streams=${streams.join("/")}`
}

/**
 * Creates a kline stream name
 */
export const getKlineStreamName = (symbol: string, interval: ChartInterval): string => {
  return `${symbol.toLowerCase()}@kline_${interval}`
}

/**
 * Creates a trade stream name
 */
export const getTradeStreamName = (symbol: string): string => {
  return `${symbol.toLowerCase()}@trade`
}

/**
 * Parses raw Binance kline WebSocket data to candlestick format
 */
export const parseKlineData = (data: BinanceKlineWS): CandlestickData => {
  return {
    time: Math.floor(data.k.t / 1000), // Convert ms to seconds for lightweight-charts
    open: Number.parseFloat(data.k.o),
    high: Number.parseFloat(data.k.h),
    low: Number.parseFloat(data.k.l),
    close: Number.parseFloat(data.k.c),
    volume: Number.parseFloat(data.k.v),
  }
}

/**
 * WebSocket Manager Class
 * Handles connection lifecycle, reconnection, and message routing
 */
export class BinanceWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: ReturnType<typeof setInterval> | null = null
  private streams: string[] = []

  private klineHandlers: Map<string, KlineHandler> = new Map()
  private tradeHandlers: Map<string, TradeHandler> = new Map()
  private connectionHandlers: Set<ConnectionHandler> = new Set()

  /**
   * Connects to Binance WebSocket with specified streams
   */
  connect(streams: string[]): void {
    this.streams = streams
    this.createConnection()
  }

  /**
   * Creates the WebSocket connection
   */
  private createConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close()
    }

    const url = createStreamUrl(this.streams)
    this.notifyConnectionState("connecting")

    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.notifyConnectionState("connected")
      this.startPing()
    }

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data)
    }

    this.ws.onerror = () => {
      this.notifyConnectionState("error")
    }

    this.ws.onclose = () => {
      this.notifyConnectionState("disconnected")
      this.stopPing()
      this.attemptReconnect()
    }
  }

  /**
   * Handles incoming WebSocket messages
   */
  private handleMessage(rawData: string): void {
    try {
      const parsed = JSON.parse(rawData)

      // Handle combined stream format
      const data = parsed.data || parsed

      if (data.e === "kline") {
        const klineData = data as BinanceKlineWS
        const streamKey = getKlineStreamName(klineData.s, klineData.k.i as ChartInterval)
        const handler = this.klineHandlers.get(streamKey)
        if (handler) {
          handler(parseKlineData(klineData))
        }
      } else if (data.e === "trade") {
        const tradeData = data as TradeStreamData
        const streamKey = getTradeStreamName(tradeData.s)
        const handler = this.tradeHandlers.get(streamKey)
        if (handler) {
          handler(tradeData)
        }
      }
    } catch (error) {
      console.error("WebSocket message parse error:", error)
    }
  }

  /**
   * Attempts to reconnect after connection loss
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnection attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      if (this.streams.length > 0) {
        this.createConnection()
      }
    }, delay)
  }

  /**
   * Starts ping interval to keep connection alive
   */
  private startPing(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ method: "ping" }))
      }
    }, 30000)
  }

  /**
   * Stops the ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  /**
   * Notifies all connection state handlers
   */
  private notifyConnectionState(state: ConnectionState): void {
    this.connectionHandlers.forEach((handler) => handler(state))
  }

  /**
   * Subscribes to kline updates for a symbol/interval
   */
  subscribeKline(symbol: string, interval: ChartInterval, handler: KlineHandler): void {
    const streamKey = getKlineStreamName(symbol, interval)
    this.klineHandlers.set(streamKey, handler)
  }

  /**
   * Unsubscribes from kline updates
   */
  unsubscribeKline(symbol: string, interval: ChartInterval): void {
    const streamKey = getKlineStreamName(symbol, interval)
    this.klineHandlers.delete(streamKey)
  }

  /**
   * Subscribes to trade updates for a symbol
   */
  subscribeTrade(symbol: string, handler: TradeHandler): void {
    const streamKey = getTradeStreamName(symbol)
    this.tradeHandlers.set(streamKey, handler)
  }

  /**
   * Unsubscribes from trade updates
   */
  unsubscribeTrade(symbol: string): void {
    const streamKey = getTradeStreamName(symbol)
    this.tradeHandlers.delete(streamKey)
  }

  /**
   * Adds a connection state handler
   */
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler)
    return () => this.connectionHandlers.delete(handler)
  }

  /**
   * Gets current connection state
   */
  getState(): ConnectionState {
    if (!this.ws) return "disconnected"
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting"
      case WebSocket.OPEN:
        return "connected"
      default:
        return "disconnected"
    }
  }

  /**
   * Closes the WebSocket connection and cleans up
   */
  disconnect(): void {
    this.stopPing()
    this.klineHandlers.clear()
    this.tradeHandlers.clear()
    this.connectionHandlers.clear()
    this.streams = []

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

// Singleton instance for global WebSocket management
let wsInstance: BinanceWebSocket | null = null

/**
 * Gets or creates the singleton WebSocket instance
 */
export const getWebSocketInstance = (): BinanceWebSocket => {
  if (!wsInstance) {
    wsInstance = new BinanceWebSocket()
  }
  return wsInstance
}

/**
 * Destroys the singleton WebSocket instance
 */
export const destroyWebSocketInstance = (): void => {
  if (wsInstance) {
    wsInstance.disconnect()
    wsInstance = null
  }
}
