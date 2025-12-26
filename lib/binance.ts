const BASE_URL = process.env.NEXT_PUBLIC_BINANCE_TESTNET_URL!;

export async function getKlines(symbol: string, interval: string, limit = 500) {
  const url = `${BASE_URL}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(
    interval
  )}&limit=${encodeURIComponent(String(limit))}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch klines");
  return res.json();
}

export async function get24hrTicker(symbol: string) {
  const url = `${BASE_URL}/api/v3/ticker/24hr?symbol=${encodeURIComponent(symbol)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch ticker")
  return res.json();
}

async function signedRequest(path: string, method = "GET", params: Record<string, any> = {}) {
  const creds = getApiCredentials()
  if (!creds) throw new Error("Missing API credentials")

  const ts = Date.now()
  const allParams = { ...params, timestamp: ts }
  const qs = new URLSearchParams(Object.entries(allParams).map(([k, v]) => [k, String(v)])).toString()
  const signature = await hmacSha256Hex(qs, creds.secretKey)
  const url = `${BASE_URL}${path}?${qs}&signature=${signature}`

  const opts: RequestInit = {
    method,
    headers: {
      "X-MBX-APIKEY": creds.apiKey,
    },
  }

  if (method === "POST") {
    opts.headers = { ...opts.headers, "Content-Type": "application/x-www-form-urlencoded" }
    opts.body = qs + `&signature=${signature}`
  }

  const res = await fetch(url, opts)
  if (!res.ok) throw new Error("Binance API error")
  return res.json()
}

export async function getAccountInfo() {
  return signedRequest("/api/v3/account", "GET")
}

export async function getOpenOrders(symbol: string) {
  return signedRequest("/api/v3/openOrders", "GET", { symbol })
}

export async function getMyTrades(symbol: string) {
  return signedRequest("/api/v3/myTrades", "GET", { symbol })
}

export async function placeOrder(order: { symbol: string; side: string; type: string; quantity: string }) {
  return signedRequest("/api/v3/order", "POST", order as Record<string, any>)
}

export async function cancelOrder(symbol: string, orderId: number) {
  return signedRequest("/api/v3/order", "DELETE", { symbol, orderId })
}


// --- Convenience helpers for storing/testing API credentials (TESTNET ONLY) ---
const CREDENTIALS_KEY = "binance_credentials";

export function getApiCredentials(): { apiKey: string; secretKey: string } | null {
  // Server-side: fall back to build-time env vars (convenience for local dev)
  if (typeof window === "undefined") {
    const apiKey = process.env.NEXT_PUBLIC_BINANCE_API_KEY;
    const secretKey = process.env.NEXT_PUBLIC_BINANCE_SECRET_KEY;
    return apiKey && secretKey ? { apiKey, secretKey } : null;
  }

  // Client-side: check localStorage first
  try {
    const raw = localStorage.getItem(CREDENTIALS_KEY);
    if (raw) return JSON.parse(raw) as { apiKey: string; secretKey: string };
  } catch {
    // ignore
  }

  // Fallback: if env provided at build-time, use that and persist to localStorage
  const apiKey = process.env.NEXT_PUBLIC_BINANCE_API_KEY;
  const secretKey = process.env.NEXT_PUBLIC_BINANCE_SECRET_KEY;
  if (apiKey && secretKey) {
    const creds = { apiKey, secretKey };
    try {
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
    } catch {
      /* noop */
    }
    return creds;
  }

  return null;
}

export function saveApiCredentials(creds: { apiKey: string; secretKey: string }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(creds));
  } catch {
    // noop
  }
}

export function clearApiCredentials() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CREDENTIALS_KEY);
  } catch {
    // noop
  }
}

async function hmacSha256Hex(message: string, key: string): Promise<string> {
  // Use SubtleCrypto available in browsers
  const enc = new TextEncoder();
  const keyData = enc.encode(key);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  const bytes = new Uint8Array(sig);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function testApiConnection(): Promise<boolean> {
  const creds = getApiCredentials();
  if (!creds) return false;

  try {
    const timestamp = Date.now();
    const query = `timestamp=${timestamp}`;
    const signature = await hmacSha256Hex(query, creds.secretKey);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${BASE_URL}/api/v3/account?${query}&signature=${signature}`, {
      headers: { "X-MBX-APIKEY": creds.apiKey },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Starts a user data stream (returns a listenKey)
 * See: POST /api/v3/userDataStream
 */
export async function startUserDataStream(): Promise<string> {
  const creds = getApiCredentials();
  if (!creds) throw new Error("Missing API credentials");

  const res = await fetch(`${BASE_URL}/api/v3/userDataStream`, {
    method: "POST",
    headers: { "X-MBX-APIKEY": creds.apiKey },
  });

  if (!res.ok) throw new Error("Failed to start user data stream");
  const data = await res.json();
  return data.listenKey as string;
}

export async function keepAliveUserDataStream(listenKey: string): Promise<boolean> {
  const creds = getApiCredentials();
  if (!creds) throw new Error("Missing API credentials");

  const res = await fetch(`${BASE_URL}/api/v3/userDataStream?listenKey=${encodeURIComponent(listenKey)}`, {
    method: "PUT",
    headers: { "X-MBX-APIKEY": creds.apiKey },
  });

  return res.ok;
}

export async function closeUserDataStream(listenKey: string): Promise<boolean> {
  const creds = getApiCredentials();
  if (!creds) throw new Error("Missing API credentials");

  const res = await fetch(`${BASE_URL}/api/v3/userDataStream?listenKey=${encodeURIComponent(listenKey)}`, {
    method: "DELETE",
    headers: { "X-MBX-APIKEY": creds.apiKey },
  });

  return res.ok;
}
