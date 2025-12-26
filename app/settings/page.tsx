/**
 * Settings Page
 * API key configuration for Binance Testnet
 *
 * SECURITY NOTE: This implementation stores API keys in localStorage for testnet
 * convenience only. In a production environment, API keys should NEVER be stored
 * on the client side. Instead, use server-side storage with proper encryption,
 * secure session management, and OAuth flows where possible.
 */

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle, Shield, AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { credentials, isAuthenticated, isLoading, error, login, logout } = useAuth()
  const [apiKey, setApiKey] = useState("")
  const [secretKey, setSecretKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [showSecretKey, setShowSecretKey] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const router = useRouter()

  // populate inputs from stored creds
  useEffect(() => {
    if (credentials) {
      setApiKey(credentials.apiKey)
      setSecretKey(credentials.secretKey)
    }
  }, [credentials])

  const maskKey = (key: string) => {
    if (key.length <= 8) return key
    return `${key.slice(0, 4)}${"*".repeat(key.length - 8)}${key.slice(-4)}`
  }

  const handleLogin = async () => {
    if (!apiKey || !secretKey) return
    const ok = await login(apiKey.trim(), secretKey.trim())
    if (ok) {
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 1200)
      // optionally navigate back to the trading page
      router.push("/")
    }
  }

  const handleLogout = () => {
    logout()
    setApiKey("")
    setSecretKey("")
    router.push("/settings")
  }

  return (
    <div className="min-h-screen bg-trading-bg">
      {/* Header */}
      <header className="h-14 bg-trading-panel border-b border-trading-border flex items-center px-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-trading-text-secondary hover:text-trading-text transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Trading</span>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold text-trading-text mb-2">Login / API Settings</h1>
        <p className="text-trading-text-secondary mb-6">Enter your Binance Testnet API credentials to enable trading.</p>

        <div className="bg-trading-warning/10 border border-trading-warning/40 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-trading-warning shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-trading-warning mb-1">Testnet Only</h3>
              <p className="text-sm text-trading-text-secondary">This flows stores API keys in localStorage for testnet convenience only.</p>
            </div>
          </div>
        </div>

        <div className="bg-trading-panel rounded-lg p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-trading-info" />
            <h2 className="text-lg font-medium text-trading-text">API Credentials</h2>
          </div>

          <div className="mb-4">
            <label className="block text-sm text-trading-text-secondary mb-2">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Binance Testnet API Key"
                className="w-full bg-trading-card border border-trading-border rounded px-4 py-2.5 text-trading-text font-mono text-sm focus:border-trading-warning focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-trading-text-muted hover:text-trading-text transition-colors"
                aria-label="Toggle API Key visibility"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {apiKey && !showApiKey && (
              <p className="mt-1 text-xs text-trading-text-muted font-mono">{maskKey(apiKey)}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm text-trading-text-secondary mb-2">Secret Key</label>
            <div className="relative">
              <input
                type={showSecretKey ? "text" : "password"}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Enter your Binance Testnet Secret Key"
                className="w-full bg-trading-card border border-trading-border rounded px-4 py-2.5 text-trading-text font-mono text-sm focus:border-trading-warning focus:outline-none pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-trading-text-muted hover:text-trading-text transition-colors"
                aria-label="Toggle secret key visibility"
              >
                {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {secretKey && !showSecretKey && (
              <p className="mt-1 text-xs text-trading-text-muted font-mono">{maskKey(secretKey)}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isAuthenticated ? (
              <button
                onClick={handleLogin}
                disabled={!apiKey || !secretKey || isLoading}
                className="px-4 py-2 bg-trading-info hover:bg-trading-info/90 text-white rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-trading-card hover:bg-trading-row-hover text-trading-text-secondary rounded font-medium text-sm transition-colors"
              >
                Logout
              </button>
            )}

            <button
              onClick={() => {
                setIsSaved(true)
                setTimeout(() => setIsSaved(false), 1200)
              }}
              disabled={!apiKey || !secretKey}
              className="px-4 py-2 bg-trading-warning hover:bg-trading-warning/90 text-black rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                "Save (Local)"
              )}
            </button>
          </div>

          {/* Feedback */}
          {error && (
            <div className="mt-4 p-3 bg-trading-sell/10 border border-trading-sell/30 rounded flex items-start gap-2">
              <XCircle className="h-4 w-4 text-trading-sell shrink-0 mt-0.5" />
              <span className="text-xs text-trading-sell">{error}</span>
            </div>
          )}

          {isAuthenticated && (
            <div className="mt-4 p-3 bg-trading-buy/10 border border-trading-buy/30 rounded flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-trading-buy shrink-0 mt-0.5" />
              <span className="text-xs text-trading-buy">Logged in. You can place test orders on Testnet.</span>
            </div>
          )}
        </div>

        <div className="bg-trading-card rounded-lg p-4">
          <h3 className="text-sm font-medium text-trading-text mb-2">Storage Information</h3>
          <p className="text-xs text-trading-text-muted leading-relaxed">
            API credentials are stored in your browser's localStorage under the key
            <code className="mx-1 px-1 py-0.5 bg-trading-panel rounded text-trading-text-secondary">binance_credentials</code>.
            This data persists across browser sessions but is only accessible from this domain. Clear stored credentials via
            the <strong>Logout</strong> button.
          </p>
        </div>

        <div className="mt-6 text-sm text-trading-text-secondary">
          <p className="mb-2">Need Testnet API keys?</p>
          <a href="https://testnet.binance.vision/" target="_blank" rel="noopener noreferrer" className="text-trading-info hover:underline">
            Get them from Binance Testnet →
          </a>
        </div>
      </main>
    </div>
  )
}
