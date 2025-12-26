import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Trading Platform | Binance Testnet",
  description: "Real-time trading platform UI with candlestick charts and order management for Binance Testnet",
  generator: "Next.js",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#0B0E11",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      {/*
        Remove attributes injected by browser extensions (dev convenience)
        This runs early so React hydration won't error when an extension
        mutates the document before React loads (e.g., bbai-tooltip-injected)
        Only intended as a developer convenience; prefer disabling the extension.
      */}
      <head>
        {process.env.NODE_ENV === "development" && (
          // Inline script runs before React hydration to sanitize DOM
          <script
            dangerouslySetInnerHTML={{
              __html: `(() => {
                try {
                  const attrs = ["bbai-tooltip-injected"];
                  const el = document.documentElement;
                  attrs.forEach((a) => el.hasAttribute(a) && el.removeAttribute(a));
                } catch (e) { /* ignore */ }
              })();`,
            }}
          />
        )}
      </head>

      <body className={`font-sans antialiased ${_geist.className}`}>
        <ThemeProvider attribute="class">{children}</ThemeProvider>
      </body>
    </html>
  )
}
