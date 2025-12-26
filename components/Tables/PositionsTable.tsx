/**
 * PositionsTable Component
 * Displays open positions with live PnL information
 *
 * NOTE: Binance Spot API doesn't have native "positions" like Futures.
 * This component demonstrates a futures-style position display.
 * For spot trading, positions are derived from account balances.
 */

"use client"

import type { Position } from "@/types/trade"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PositionsTableProps {
  positions: Position[]
  isLoading: boolean
  currentPrice?: string
}

export const PositionsTable = ({ positions, isLoading, currentPrice }: PositionsTableProps) => {
  /**
   * Formats number for display with proper decimals
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
   * Calculates unrealized PnL based on current price
   * PnL = (Mark Price - Entry Price) * Quantity * Direction
   */
  const calculatePnL = (position: Position): { value: string; isPositive: boolean } => {
    const entryPrice = Number.parseFloat(position.entryPrice)
    const markPrice = currentPrice ? Number.parseFloat(currentPrice) : Number.parseFloat(position.markPrice)
    const quantity = Number.parseFloat(position.quantity)
    const direction = position.side === "LONG" ? 1 : -1

    const pnl = (markPrice - entryPrice) * quantity * direction

    return {
      value: pnl.toFixed(4),
      isPositive: pnl >= 0,
    }
  }

  /**
   * Gets PnL color class based on value
   */
  const getPnlColorClass = (isPositive: boolean) => {
    return isPositive ? "text-trading-buy" : "text-trading-sell"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-trading-warning border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-trading-text-muted">
        <span className="text-sm">No open positions</span>
        <span className="text-xs mt-1">Your active positions will appear here</span>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-trading-text-muted text-xs border-b border-trading-border">
            <th className="text-left py-2.5 px-3 font-medium">Symbol</th>
            <th className="text-left py-2.5 px-3 font-medium">Side</th>
            <th className="text-right py-2.5 px-3 font-medium">Size</th>
            <th className="text-right py-2.5 px-3 font-medium">Entry Price</th>
            <th className="text-right py-2.5 px-3 font-medium">Mark Price</th>
            <th className="text-right py-2.5 px-3 font-medium">Unrealized PnL</th>
            <th className="text-right py-2.5 px-3 font-medium">Leverage</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((position, index) => {
            const pnl = calculatePnL(position)
            const displayMarkPrice = currentPrice || position.markPrice

            return (
              <tr
                key={`${position.symbol}-${index}`}
                className="border-b border-trading-border/50 hover:bg-trading-row-hover transition-colors"
              >
                <td className="py-2.5 px-3 text-trading-text font-medium">{position.symbol}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex items-center gap-1 ${
                      position.side === "LONG" ? "text-trading-buy" : "text-trading-sell"
                    }`}
                  >
                    {position.side === "LONG" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {position.side}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-trading-text">
                  {formatNumber(position.quantity)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-trading-text">
                  {formatNumber(position.entryPrice)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-trading-text">
                  {/* Live mark price from WebSocket */}
                  {formatNumber(displayMarkPrice)}
                </td>
                <td className={`py-2.5 px-3 text-right font-mono ${getPnlColorClass(pnl.isPositive)}`}>
                  <span className="inline-flex items-center gap-1">
                    {pnl.isPositive ? "+" : ""}
                    {formatNumber(pnl.value)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 bg-trading-warning/20 text-trading-warning text-xs rounded font-mono">
                    {position.leverage}x
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
