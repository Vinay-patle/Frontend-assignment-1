/**
 * Trade-related TypeScript type definitions
 * Covers orders, positions, trades, and API responses
 */

/** Order side - buy or sell */
export type OrderSide = "BUY" | "SELL"

/** Order type */
export type OrderType = "LIMIT" | "MARKET" | "STOP_LOSS" | "STOP_LOSS_LIMIT" | "TAKE_PROFIT" | "TAKE_PROFIT_LIMIT"

/** Order status */
export type OrderStatus = "NEW" | "PARTIALLY_FILLED" | "FILLED" | "CANCELED" | "PENDING_CANCEL" | "REJECTED" | "EXPIRED"

/** Position side for futures */
export type PositionSide = "LONG" | "SHORT" | "BOTH"

/** Time in force */
export type TimeInForce = "GTC" | "IOC" | "FOK"

/** Order request parameters */
export interface OrderRequest {
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: string
  price?: string
  stopPrice?: string
  timeInForce?: TimeInForce
}

/** Order response from Binance */
export interface Order {
  symbol: string
  orderId: number
  orderListId: number
  clientOrderId: string
  price: string
  origQty: string
  executedQty: string
  cummulativeQuoteQty: string
  status: OrderStatus
  timeInForce: TimeInForce
  type: OrderType
  side: OrderSide
  stopPrice: string
  icebergQty: string
  time: number
  updateTime: number
  isWorking: boolean
  origQuoteOrderQty: string
}

/** Trade/fill data */
export interface Trade {
  id: number
  symbol: string
  orderId: number
  price: string
  qty: string
  quoteQty: string
  commission: string
  commissionAsset: string
  time: number
  isBuyer: boolean
  isMaker: boolean
  isBestMatch: boolean
}

/** Position data (for futures-style display) */
export interface Position {
  symbol: string
  side: PositionSide
  entryPrice: string
  markPrice: string
  quantity: string
  unrealizedPnl: string
  leverage: number
  marginType: "cross" | "isolated"
  liquidationPrice: string
}

/** Ticker price data */
export interface TickerPrice {
  symbol: string
  price: string
}

/** 24hr ticker statistics */
export interface Ticker24hr {
  symbol: string
  priceChange: string
  priceChangePercent: string
  weightedAvgPrice: string
  prevClosePrice: string
  lastPrice: string
  lastQty: string
  bidPrice: string
  bidQty: string
  askPrice: string
  askQty: string
  openPrice: string
  highPrice: string
  lowPrice: string
  volume: string
  quoteVolume: string
  openTime: number
  closeTime: number
  firstId: number
  lastId: number
  count: number
}

/** Account information */
export interface AccountInfo {
  makerCommission: number
  takerCommission: number
  buyerCommission: number
  sellerCommission: number
  canTrade: boolean
  canWithdraw: boolean
  canDeposit: boolean
  updateTime: number
  accountType: string
  balances: Balance[]
}

/** Asset balance */
export interface Balance {
  asset: string
  free: string
  locked: string
}

/** WebSocket trade stream data */
export interface TradeStreamData {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  t: number // Trade ID
  p: string // Price
  q: string // Quantity
  b: number // Buyer order ID
  a: number // Seller order ID
  T: number // Trade time
  m: boolean // Is buyer the market maker?
  M: boolean // Ignore
}

/** API error response */
export interface BinanceError {
  code: number
  msg: string
}

/** API credentials stored in localStorage */
export interface ApiCredentials {
  apiKey: string
  secretKey: string
}
