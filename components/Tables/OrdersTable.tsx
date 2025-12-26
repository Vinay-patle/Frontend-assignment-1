/**
 * OrdersTable Component
 * Displays open orders with cancel functionality
 *
 * COLUMNS (Binance-style):
 * - Time: Order creation timestamp
 * - Symbol: Trading pair
 * - Type: LIMIT, MARKET, etc.
 * - Side: BUY (green) / SELL (red)
 * - Price: Order price (or Market for market orders)
 * - Amount: Original quantity
 * - Filled: Executed quantity
 * - Status: NEW, PARTIALLY_FILLED, etc.
 * - Action: Cancel button
 */

"use client"

import { X, Loader2, Clock } from "lucide-react"
import { useState } from "react"
import type { Order } from "@/types/trade"

interface OrdersTableProps {
  orders: Order[]
  isLoading: boolean
  onCancelOrder: (symbol: string, orderId: number) => Promise<boolean>
}

export const OrdersTable = ({ orders, isLoading, onCancelOrder }: OrdersTableProps) => {
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  /**
   * Formats number for display
   */
  const formatNumber = (value: string, decimals = 4) => {
    const num = Number.parseFloat(value)
    if (Number.isNaN(num)) return "—"
    return num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  /**
   * Formats timestamp to readable date
   */
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  /**
   * Gets status badge styling
   */
  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      NEW: "bg-trading-info/20 text-trading-info",
      PARTIALLY_FILLED: "bg-trading-warning/20 text-trading-warning",
      FILLED: "bg-trading-buy/20 text-trading-buy",
      CANCELED: "bg-trading-text-muted/20 text-trading-text-muted",
      REJECTED: "bg-trading-sell/20 text-trading-sell",
      EXPIRED: "bg-trading-text-muted/20 text-trading-text-muted",
    }
    return styles[status] || "bg-trading-card text-trading-text-secondary"
  }

  /**
   * Calculates fill percentage
   */
  const getFillPercentage = (executed: string, original: string): number => {
    const exec = Number.parseFloat(executed)
    const orig = Number.parseFloat(original)
    if (orig === 0) return 0
    return Math.round((exec / orig) * 100)
  }

  /**
   * Handles order cancellation with loading state
   */
  const handleCancel = async (symbol: string, orderId: number) => {
    setCancelingId(orderId)
    try {
      await onCancelOrder(symbol, orderId)
    } finally {
      setCancelingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-trading-warning border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-trading-text-muted">
        <Clock className="h-8 w-8 mb-2 opacity-50" />
        <span className="text-sm">No open orders</span>
        <span className="text-xs mt-1">Your active orders will appear here</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-trading-text-muted text-xs border-b border-trading-border">
            <th className="text-left py-2.5 px-3 font-medium">Time</th>
            <th className="text-left py-2.5 px-3 font-medium">Symbol</th>
            <th className="text-left py-2.5 px-3 font-medium">Type</th>
            <th className="text-left py-2.5 px-3 font-medium">Side</th>
            <th className="text-right py-2.5 px-3 font-medium">Price</th>
            <th className="text-right py-2.5 px-3 font-medium">Amount</th>
            <th className="text-right py-2.5 px-3 font-medium">Filled</th>
            <th className="text-center py-2.5 px-3 font-medium">Status</th>
            <th className="text-center py-2.5 px-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const fillPct = getFillPercentage(order.executedQty, order.origQty)

            return (
              <tr
                key={order.orderId}
                className="border-b border-trading-border/50 hover:bg-trading-row-hover transition-colors"
              >
                <td className="py-2.5 px-3 text-trading-text-secondary text-xs whitespace-nowrap">
                  {formatTime(order.time)}
                </td>
                <td className="py-2.5 px-3 text-trading-text font-medium">{order.symbol}</td>
                <td className="py-2.5 px-3 text-trading-text-secondary text-xs">{order.type}</td>
                <td className="py-2.5 px-3">
                  <span className={`font-medium ${order.side === "BUY" ? "text-trading-buy" : "text-trading-sell"}`}>
                    {order.side}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-trading-text">
                  {order.type === "MARKET" ? "Market" : formatNumber(order.price)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-trading-text">{formatNumber(order.origQty)}</td>
                <td className="py-2.5 px-3 text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-mono text-trading-text-secondary">{formatNumber(order.executedQty)}</span>
                    {fillPct > 0 && (
                      <div className="w-16 h-1 bg-trading-card rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-trading-warning rounded-full" style={{ width: `${fillPct}%` }} />
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(order.status)}`}>
                    {order.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  {(order.status === "NEW" || order.status === "PARTIALLY_FILLED") && (
                    <button
                      onClick={() => handleCancel(order.symbol, order.orderId)}
                      disabled={cancelingId === order.orderId}
                      className="p-1.5 hover:bg-trading-sell/20 rounded transition-colors disabled:opacity-50 group"
                      title="Cancel Order"
                    >
                      {cancelingId === order.orderId ? (
                        <Loader2 className="h-4 w-4 text-trading-text-muted animate-spin" />
                      ) : (
                        <X className="h-4 w-4 text-trading-text-muted group-hover:text-trading-sell transition-colors" />
                      )}
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
