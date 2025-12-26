"use client";

import { useEffect, useRef } from "react";
import type { IChartApi, ISeriesApi, CandlestickData as LW_Candlestick } from "lightweight-charts";

import { getKlines } from "@/lib/binance";

import type { ChartInterval, BinanceKline, CandlestickData } from "@/types/chart";

type Props = {
  symbol: string;
  interval: ChartInterval;
  historicalData: BinanceKline[];
  lastCandle: CandlestickData | null;
  isLoading: boolean;
};

export default function TradingChart({ symbol, interval, historicalData, lastCandle }: Props) {
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* -------------------------------
     CREATE CHART (ONCE)
  -------------------------------- */
  useEffect(() => {
    if (!containerRef.current || chartRef.current) return;

    let disposed = false;

    (async () => {
      try {
        const lc = await import("lightweight-charts");

        if (disposed) return;

        const chart: IChartApi = lc.createChart(containerRef.current!, {
          layout: {
            background: { color: "#0B0E11" },
            textColor: "#EAECEF",
          },
          grid: {
            vertLines: { color: "#1E2329" },
            horzLines: { color: "#1E2329" },
          },
          width: containerRef.current!.clientWidth,
          height: 400,
        });

        // Guard against unexpected API shapes (helps with bundler/ESM quirks)
        if (typeof (chart as any).addCandlestickSeries !== "function") {
          // Provide a helpful runtime error so it's easier to debug in dev
          console.error(
            "lightweight-charts: `addCandlestickSeries` is not available on the chart instance. Check your installed library version and bundle setup.",
          );
        }

        const series: ISeriesApi<"Candlestick"> | null =
          typeof (chart as any).addCandlestickSeries === "function"
            ? (chart as any).addCandlestickSeries({
                upColor: "#0ECB81",
                downColor: "#F6465D",
                wickUpColor: "#0ECB81",
                wickDownColor: "#F6465D",
                borderVisible: false,
              })
            : null;

        chartRef.current = chart;
        seriesRef.current = series;

      } catch (err) {
        console.error("Failed to initialize chart:", err);
      }
    })();

    return () => {
      disposed = true;
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch {}
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, []);

  // Resize chart responsively
  useEffect(() => {
    const onResize = () => {
      if (!chartRef.current || !containerRef.current) return;
      try {
        chartRef.current.resize(containerRef.current.clientWidth, containerRef.current.clientHeight || 400);
      } catch {}
    };

    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* -------------------------------
     FETCH HISTORICAL CANDLES
  -------------------------------- */
  useEffect(() => {
    async function loadHistory() {
      if (!seriesRef.current) return;

      // Allow parent to pass historical data; otherwise fetch based on current interval
      const data =
        (Array.isArray(historicalData) && historicalData.length > 0 && historicalData) ||
        ((typeof window !== "undefined" && (window as any)._preloadedKlines?.[symbol]) ||
          (await getKlines(symbol, interval)));

      const candles: LW_Candlestick[] = data.map((k: any) => ({
        time: (k[0] / 1000) as any,
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
      }));

      seriesRef.current.setData(candles);
    }

    loadHistory();
  }, [symbol, interval, historicalData]);

  /* -------------------------------
     LIVE CANDLE UPDATES (from parent props)
     The parent component (page) manages WebSocket subscriptions and passes
     the latest candle in `lastCandle`. We only update the series here to
     avoid creating another WebSocket connection.
  -------------------------------- */
  useEffect(() => {
    if (!seriesRef.current || !lastCandle) return;

    const candle: LW_Candlestick = {
      time: lastCandle.time as any,
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: lastCandle.close,
    };

    seriesRef.current.update(candle);
  }, [lastCandle]);

  return <div ref={containerRef} className="w-full h-100" />;
}
