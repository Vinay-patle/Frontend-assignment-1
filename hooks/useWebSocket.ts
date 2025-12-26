import { useEffect, useRef, useState } from "react";
import { getWebSocketInstance, type ConnectionState } from "@/lib/websocket";
import type { ChartInterval } from "@/types/chart";

type MessageHandler = (data: any) => void;

type Options = {
  symbol: string;
  interval: ChartInterval;
  onKlineUpdate?: (k: any) => void;
  onTradeUpdate?: (t: any) => void;
};

// New implementation uses the singleton BinanceWebSocket manager for the object form
// which centralizes reconnection, ping, and subscription handling. The string form
// is still supported for quick one-off WebSocket URLs.
export function useWebSocket(urlOrOptions: string | Options, onMessage?: MessageHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("connecting");

  useEffect(() => {
    // String form: (url, onMessage) — keep the lightweight direct WebSocket for ad-hoc streams
    if (typeof urlOrOptions === "string") {
      const url = urlOrOptions;
      if (!url || !onMessage) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => setConnectionState("connected");
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {}
      };
      ws.onerror = () => setConnectionState("error");
      ws.onclose = () => setConnectionState("disconnected");

      return () => ws.close();
    }

    // Object form: use the centralized BinanceWebSocket singleton
    const { symbol, interval, onKlineUpdate, onTradeUpdate } = urlOrOptions;
    if (!symbol) return;

    const wsi = getWebSocketInstance();

    // Subscribe handlers
    const kHandler = (k: any) => onKlineUpdate?.(k);
    const tHandler = (t: any) => onTradeUpdate?.(t);

    wsi.subscribeKline(symbol, interval, kHandler);
    wsi.subscribeTrade(symbol, tHandler);

    // Ensure the underlying connection is established for these streams
    const streams = [`${symbol.toLowerCase()}@kline_${interval}`, `${symbol.toLowerCase()}@trade`];
    wsi.connect(streams);

    // Track connection state from the singleton
    const cleanupConnection = wsi.onConnectionChange((state) => setConnectionState(state));

    return () => {
      try {
        wsi.unsubscribeKline(symbol, interval);
        wsi.unsubscribeTrade(symbol);
      } catch {}
      cleanupConnection();
    };
  }, [urlOrOptions, onMessage]);

  return { connectionState } as const;
}
