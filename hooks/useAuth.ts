"use client"

import { useCallback, useEffect, useState } from "react"
import * as binance from "@/lib/binance"

type Creds = { apiKey: string; secretKey: string }

export function useAuth() {
  const [credentials, setCredentials] = useState<Creds | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load from storage on mount
  useEffect(() => {
    const creds = binance.getApiCredentials()
    if (creds) {
      setCredentials(creds)
      // lazily verify credentials
      ;(async () => {
        try {
          setIsLoading(true)
          const ok = await binance.testApiConnection()
          setIsAuthenticated(ok)
        } finally {
          setIsLoading(false)
        }
      })()
    }
  }, [])

  const login = useCallback(async (apiKey: string, secretKey: string) => {
    setError(null)
    setIsLoading(true)
    try {
      // Persist locally first (test uses local storage in lib)
      binance.saveApiCredentials({ apiKey, secretKey })
      setCredentials({ apiKey, secretKey })

      const ok = await binance.testApiConnection()
      setIsAuthenticated(ok)
      if (!ok) {
        setError("Invalid API credentials or connection failed")
        // keep credentials saved but mark unauthenticated so user can troubleshoot
      }
      return ok
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setIsAuthenticated(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    binance.clearApiCredentials()
    setCredentials(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  return {
    credentials,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
  }
}
