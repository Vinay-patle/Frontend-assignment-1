/**
 * Header Component
 * Displays logo, testnet indicator, connection status, and navigation
 */

"use client"

import Link from "next/link"
import { useTheme } from "next-themes"
import { Settings, Wifi, WifiOff, Activity, Sun, Moon, UserCheck } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import type { ConnectionState } from "@/lib/websocket"

interface HeaderProps {
  connectionState: ConnectionState
  symbol: string
}

export const Header = ({ connectionState, symbol }: HeaderProps) => {
  const isConnected = connectionState === "connected"
  const { theme, setTheme } = useTheme()
  const { isAuthenticated } = useAuth()

  return (
    <header className="h-14 bg-trading-panel border-b border-trading-border flex items-center justify-between px-4">
      {/* Left: Logo and Testnet Badge */}
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-trading-warning" />
          <span className="text-lg font-semibold text-trading-text">TradingView</span>
        </Link>

        {/* Testnet Indicator */}
        <div className="px-2 py-0.5 bg-trading-warning/20 border border-trading-warning/40 rounded text-xs font-medium text-trading-warning">
          TESTNET
        </div>

        {/* Current Symbol */}
        <div className="text-trading-text-secondary text-sm">{symbol}</div>
      </div>

      {/* Right: Connection Status and Settings */}
      <div className="flex items-center gap-4">
        {/* WebSocket Connection Status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-trading-buy" />
              <span className="text-xs text-trading-buy">Connected</span>
            </>
          ) : connectionState === "connecting" ? (
            <>
              <Wifi className="h-4 w-4 text-trading-warning animate-pulse" />
              <span className="text-xs text-trading-warning">Connecting...</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-trading-sell" />
              <span className="text-xs text-trading-sell">Disconnected</span>
            </>
          )}
        </div>

        {/* Settings Link */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-1 rounded hover:bg-trading-row-hover transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-trading-text-secondary" /> : <Moon className="h-4 w-4 text-trading-text-secondary" />}
          </button>

          {/* Profile indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-trading-card hover:bg-trading-row-hover transition-colors">
            <div className="h-7 w-7 rounded-full bg-trading-border flex items-center justify-center text-xs font-medium text-trading-text-secondary">
              {isAuthenticated ? <UserCheck className="h-4 w-4" /> : "U"}
            </div>
            <div className={`text-sm ${isAuthenticated ? "text-trading-buy" : "text-trading-text-secondary"}`}>
              {isAuthenticated ? "Logged In" : "Profile"}
            </div>
          </div>

          <Link
            href="/settings"
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-trading-card hover:bg-trading-row-hover transition-colors"
          >
            <Settings className="h-4 w-4 text-trading-text-secondary" />
            <span className="text-sm text-trading-text-secondary">Settings</span>
          </Link>
        </div>
      </div>
    </header>
  )
}
