/**
 * OrderPanel Component
 * Order entry panel with Buy/Sell toggle, Market order type, quantity input
 *
 * ARCHITECTURE NOTE: This component handles UI state and validation only.
 * Actual API calls are delegated to the parent via onPlaceOrder callback.
 * This separation keeps the component focused on presentation logic.
 */

"use client"

import { useState, useCallback, useEffect } from "react"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import type { OrderSide, OrderRequest } from "@/types/trade"

interface OrderPanelProps {
  symbol: string
  currentPrice: string
  onPlaceOrder: (order: OrderRequest) => Promise<void>
  isAuthenticated: boolean
  isSubmitting?: boolean
  orderError?: string | null
  orderSuccess?: string | null
  onClearMessages?: () => void
}

export const OrderPanel = ({
  symbol,
  currentPrice,
  onPlaceOrder,
  isAuthenticated,
  isSubmitting = false,
  orderError = null,
  orderSuccess = null,
  onClearMessages,
}: OrderPanelProps) => {
  const [side, setSide] = useState<OrderSide>("BUY")
  const [quantity, setQuantity] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (orderSuccess || orderError) {
      const timer = setTimeout(() => {
        onClearMessages?.()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [orderSuccess, orderError, onClearMessages])

  // Clear local error when quantity changes
  useEffect(() => {
    if (localError && quantity) {
      setLocalError(null)
    }
  }, [quantity, localError])

  /**
   * Validates order input before submission
   * Returns error message or null if valid
   */
  const validateOrder = (): string | null => {
    if (!quantity || quantity.trim() === "") {
      return "Please enter a quantity"
    }

    const qty = Number.parseFloat(quantity)
    if (Number.isNaN(qty) || qty <= 0) {
      return "Please enter a valid positive quantity"
    }

    if (!currentPrice || Number.parseFloat(currentPrice) <= 0) {
      return "Market price not available"
    }

    return null
  }

  /**
   * Handles order submission with validation
   */
  const handleSubmit = useCallback(async () => {
    // Client-side validation
    const validationError = validateOrder()
    if (validationError) {
      setLocalError(validationError)
      return
    }

    if (!isAuthenticated) {
      setLocalError("Please configure API keys in Settings")
      return
    }

    setLocalError(null)

    try {
      await onPlaceOrder({
        symbol,
        side,
        type: "MARKET",
        quantity,
      })
      // Clear quantity on success (parent will show success message)
      setQuantity("")
    } catch {
      // Error handled by parent via orderError prop
    }
  }, [symbol, side, quantity, isAuthenticated, onPlaceOrder])

  /**
   * Formats price for display
   */
  const formatPrice = (price: string) => {
    const num = Number.parseFloat(price)
    if (Number.isNaN(num)) return "—"
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    })
  }

  /**
   * Calculates estimated order total
   */
  const calculateEstimatedTotal = (): string => {
    if (!quantity || !currentPrice) return "0.00"
    const qty = Number.parseFloat(quantity)
    const price = Number.parseFloat(currentPrice)
    if (Number.isNaN(qty) || Number.isNaN(price)) return "0.00"
    return (qty * price).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const isBuy = side === "BUY"
  const displayError = localError || orderError
  const isButtonDisabled = isSubmitting || !quantity || Number.parseFloat(quantity) <= 0

  return (
    <div className="bg-trading-panel rounded-lg p-4 h-full flex flex-col">
      {/* Panel Header */}
      <div className="text-sm font-medium text-trading-text mb-4">Place Order</div>

      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => setSide("BUY")}
          disabled={isSubmitting}
          className={`py-2.5 px-4 rounded font-semibold text-sm transition-all ${
            isBuy
              ? "bg-trading-buy text-white shadow-lg shadow-trading-buy/25"
              : "bg-trading-card text-trading-text-secondary hover:bg-trading-row-hover"
          } disabled:opacity-50`}
        >
          Buy
        </button>
        <button
          onClick={() => setSide("SELL")}
          disabled={isSubmitting}
          className={`py-2.5 px-4 rounded font-semibold text-sm transition-all ${
            !isBuy
              ? "bg-trading-sell text-white shadow-lg shadow-trading-sell/25"
              : "bg-trading-card text-trading-text-secondary hover:bg-trading-row-hover"
          } disabled:opacity-50`}
        >
          Sell
        </button>
      </div>

      {/* Order Type Display */}
      <div className="mb-4">
        <label className="text-xs text-trading-text-muted block mb-1.5">Order Type</label>
        <div className="bg-trading-card rounded px-3 py-2 text-sm text-trading-text border border-trading-border">
          Market
        </div>
      </div>

      {/* Current Price Display */}
      <div className="mb-4">
        <label className="text-xs text-trading-text-muted block mb-1.5">Market Price</label>
        <div className={`text-xl font-mono font-semibold ${isBuy ? "text-trading-buy" : "text-trading-sell"}`}>
          {currentPrice ? formatPrice(currentPrice) : "—"}
        </div>
      </div>

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="text-xs text-trading-text-muted block mb-1.5">Quantity ({symbol.replace("USDT", "")})</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0.00"
          disabled={isSubmitting}
          className="w-full bg-trading-card border border-trading-border rounded px-3 py-2.5 text-trading-text font-mono focus:border-trading-warning focus:outline-none focus:ring-1 focus:ring-trading-warning/50 transition-all disabled:opacity-50"
          step="any"
          min="0"
        />
      </div>

      {/* Quick Quantity Buttons */}
      <div className="grid grid-cols-4 gap-1.5 mb-4">
        {["25%", "50%", "75%", "100%"].map((pct) => (
          <button
            key={pct}
            disabled={isSubmitting}
            className="py-1.5 text-xs bg-trading-card hover:bg-trading-row-hover rounded text-trading-text-secondary transition-colors border border-trading-border/50 disabled:opacity-50"
            onClick={() => {
              // Placeholder - would calculate based on available balance
              // For demo, just set a sample quantity
              const percentage = Number.parseInt(pct) / 100
              setQuantity((0.01 * percentage).toFixed(4))
            }}
          >
            {pct}
          </button>
        ))}
      </div>

      <div className="mb-4 p-3 bg-trading-card/50 rounded border border-trading-border/50">
        <div className="flex justify-between items-center">
          <span className="text-xs text-trading-text-muted">Est. Total (USDT)</span>
          <span className="font-mono text-trading-text font-medium">${calculateEstimatedTotal()}</span>
        </div>
      </div>

      {/* Error Message */}
      {displayError && (
        <div className="mb-4 p-3 bg-trading-sell/10 border border-trading-sell/30 rounded flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-trading-sell shrink-0 mt-0.5" />
          <span className="text-xs text-trading-sell">{displayError}</span>
        </div>
      )}

      {/* Success Message */}
      {orderSuccess && (
        <div className="mb-4 p-3 bg-trading-buy/10 border border-trading-buy/30 rounded flex items-start gap-2">
          <CheckCircle className="h-4 w-4 text-trading-buy shrink-0 mt-0.5" />
          <span className="text-xs text-trading-buy">{orderSuccess}</span>
        </div>
      )}

      {/* Place Order Button */}
      <button
        onClick={handleSubmit}
        disabled={isButtonDisabled}
        className={`mt-auto py-3 px-4 rounded font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
          isBuy
            ? "bg-trading-buy hover:bg-trading-buy/90 text-white shadow-lg shadow-trading-buy/20"
            : "bg-trading-sell hover:bg-trading-sell/90 text-white shadow-lg shadow-trading-sell/20"
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Placing Order...
          </>
        ) : (
          `${side} ${symbol.replace("USDT", "")}`
        )}
      </button>

      {/* Authentication Warning */}
      {!isAuthenticated && (
        <p className="mt-3 text-xs text-trading-text-muted text-center">
          Configure API keys in Settings to place orders
        </p>
      )}
    </div>
  )
}
