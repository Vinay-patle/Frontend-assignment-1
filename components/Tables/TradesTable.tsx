/**
 * TradesTable Component
 * Displays trade/fill history
 *
 * COLUMNS (Binance-style):
 * - Time: Trade execution timestamp
 * - Symbol: Trading pair
 * - Side: BUY (green) / SELL (red)
 * - Price: Execution price
 * - Quantity: Trade quantity
 * - Total: Quote quantity (price * quantity)
 * - Fee: Commission paid
 * - Role: Maker/Taker
 */

"use client"

import type { Trade } from "@/types/trade"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface TradesTableProps {
  trades: Trade[]
  isLoading: boolean
}

export const TradesTable = ({ trades, isLoading }: TradesTableProps) => {
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
   * Formats timestamp to readable date with seconds
   */
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-trading-warning border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-trading-text-muted">
        <span className="text-sm">No trade history</span>
        <span className="text-xs mt-1">Your executed trades will appear here</span>
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
            <th className="text-left py-2.5 px-3 font-medium">Side</th>
            <th className="text-right py-2.5 px-3 font-medium">Price</th>
            <th className="text-right py-2.5 px-3 font-medium">Quantity</th>
            <th className="text-right py-2.5 px-3 font-medium">Total</th>
            <th className="text-right py-2.5 px-3 font-medium">Fee</th>
            <th className="text-center py-2.5 px-3 font-medium">Role</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr
              key={trade.id}
              className="border-b border-trading-border/50 hover:bg-trading-row-hover transition-colors"
            >
              <td className="py-2.5 px-3 text-trading-text-secondary text-xs whitespace-nowrap">
                {formatTime(trade.time)}
              </td>
              <td className="py-2.5 px-3 text-trading-text font-medium">{trade.symbol}</td>
              <td className="py-2.5 px-3">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    trade.isBuyer ? "text-trading-buy" : "text-trading-sell"
                  }`}
                >
                  {trade.isBuyer ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {trade.isBuyer ? "BUY" : "SELL"}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right font-mono text-trading-text">{formatNumber(trade.price)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-trading-text">{formatNumber(trade.qty)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-trading-text">{formatNumber(trade.quoteQty, 2)}</td>
              <td className="py-2.5 px-3 text-right font-mono text-trading-text-secondary text-xs">
                {formatNumber(trade.commission, 6)}
                <span className="ml-1 text-trading-text-muted">{trade.commissionAsset}</span>
              </td>
              <td className="py-2.5 px-3 text-center">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    trade.isMaker ? "bg-trading-buy/15 text-trading-buy" : "bg-trading-warning/15 text-trading-warning"
                  }`}
                >
                  {trade.isMaker ? "Maker" : "Taker"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
