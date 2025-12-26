/**
 * Chart-related TypeScript type definitions
 * Used for TradingView lightweight-charts integration
 */

/** OHLCV candlestick data structure */
export interface CandlestickData {
  time: number // Unix timestamp in seconds
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

/** Binance kline/candlestick REST API response */
export interface BinanceKline {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
}

/** Binance kline WebSocket stream data */
export interface BinanceKlineWS {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  k: {
    t: number // Kline start time
    T: number // Kline close time
    s: string // Symbol
    i: string // Interval
    f: number // First trade ID
    L: number // Last trade ID
    o: string // Open price
    c: string // Close price
    h: string // High price
    l: string // Low price
    v: string // Base asset volume
    n: number // Number of trades
    x: boolean // Is this kline closed?
    q: string // Quote asset volume
    V: string // Taker buy base asset volume
    Q: string // Taker buy quote asset volume
    B: string // Ignore
  }
}

/** Chart configuration options */
export interface ChartConfig {
  symbol: string
  interval: ChartInterval
  theme: "dark" | "light"
}

/** Supported chart intervals */
export type ChartInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M"

/** Chart theme colors */
export interface ChartTheme {
  backgroundColor: string
  textColor: string
  gridColor: string
  crosshairColor: string
  upColor: string
  downColor: string
  wickUpColor: string
  wickDownColor: string
}
