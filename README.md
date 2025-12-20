# Frontend Developer Hiring – Coding Assignment

## Real-Time Trading Platform UI (Testnet)

### Objective

Build a frontend-only real-time trading platform UI that demonstrates:
- Real-time data handling (WebSocket streams)
- Frontend architecture and state management
- Chart integration and optimization
- UI/UX design and responsiveness

This assignment evaluates your frontend engineering skills, not just code output. You will be asked to explain architectural decisions during the interview.

**Important:** This is a testnet assignment for evaluation purposes only. It is not a real trading system and should not be used with real funds or production exchanges.

---

## Deadline

**Sunday, December 21, 2025 at 11:59 PM**

Submit via GitHub Classroom before the deadline. Late submissions will not be accepted.

---

## LLM Usage Policy

LLM assistance is acceptable for up to 20% of the work. You must:
- Understand every line of code you submit
- Be prepared to explain and modify code during the interview
- Clearly document any LLM-generated code sections
- Demonstrate your understanding of the architecture and design decisions

Inability to explain your code or architecture will result in automatic rejection.

---

## Tech Stack Requirements

**Frontend:**
- Next.js (mandatory)
- TypeScript
- lightweight-charts (TradingView) — mandatory
- WebSocket client (for real-time data)
- Tailwind CSS (for styling)
- Direct integration with Binance Testnet API

**No Backend Required:**
- All API calls go directly to Binance Testnet
- API keys stored in environment variables
- No deployment required (local development only)

---

## Submission Method

- Submit via GitHub Classroom
- Repository must contain only frontend code
- Application must run locally

---

## System Architecture Overview

Your application must follow this pattern:

```
Frontend (Next.js)
    ↓
Binance Testnet REST API (for orders)
    ↓
Binance Testnet WebSocket (for real-time prices/candles)
```

**Key principles:**
1. Direct API integration (no backend proxy)
2. Real-time WebSocket connections for market data
3. Efficient chart updates without full re-renders
4. Proper state management for orders and positions
5. Secure API key handling via environment variables

---

## Requirements

### 1. Authentication & Configuration

**No backend authentication required.** Instead:

- **API Key Configuration:**
  - Store Binance Testnet API key and secret in `.env.local`
  - Create a settings page where users can:
    - View current API key status (masked)
    - Update API keys
    - Test API key connection
  - API keys should be stored in browser (localStorage or similar)
  - Explain your storage strategy in README

- **Environment Variables:**
  ```
  NEXT_PUBLIC_BINANCE_API_KEY=your_testnet_api_key
  NEXT_PUBLIC_BINANCE_SECRET_KEY=your_testnet_secret_key
  NEXT_PUBLIC_BINANCE_TESTNET_URL=https://testnet.binance.vision
  ```

### 2. Trade Panel UI

Build a trading interface matching the provided design:

#### Header Section:
- Logo/branding
- User profile indicator
- Trading status indicator (Live Trading / Testnet)
- Theme toggle (if applicable)

#### Left Panel - Order Entry:
- **Symbol Selector:**
  - Dropdown/search for trading pairs (BTCUSDT, ETHUSDT, etc.)
  - Display current selected symbol
  - When symbol changes, chart must automatically update

- **Buy/Sell Tabs:**
  - Toggle between BUY and SELL

- **Order Type Selector:**
  - Market orders (required)
  - Limit orders (bonus)
  - Stop Market orders (bonus)

- **Input Fields:**
  - Quantity input (with BTC/USDT labels)
  - Price input (for limit orders)
  - Total calculation display

- **Account Information:**
  - Available balance (fetch from Binance Testnet)
  - Margin ratio
  - Maintenance margin

- **Place Order Button:**
  - Call Binance Testnet REST API directly
  - Show loading state
  - Display order confirmation

#### Right Panel - Chart & Positions:

- **Trading Pair Display:**
  - Show current symbol (e.g., BTCUSDT)
  - Current price with change indicator
  - 24h change percentage

- **Candlestick Chart (MANDATORY):**
  - Use `lightweight-charts` library
  - Fetch historical candles from Binance Testnet REST API
  - Subscribe to real-time candle updates via Binance WebSocket
  - Chart must update smoothly without full re-renders
  - **Critical:** When symbol changes in selector, chart must:
    - Fetch new historical data for selected symbol
    - Update WebSocket subscription to new symbol
    - Update chart display without page reload
    - Maintain chart state (timeframe, zoom level)
  - Timeframe selector (1m, 5m, 1h, 1d, 1w)
  - Chart should be responsive

- **Positions/Orders/Trades Table:**
  - Tabs: Positions, Orders, Trades
  - **Positions Tab:**
    - Fetch from Binance Testnet API
    - Columns: Symbol, Size, Entry Price, Market Price, Unrealized PnL
    - Real-time price updates via WebSocket
  - **Orders Tab:**
    - Fetch open orders from Binance Testnet API
    - Columns: Symbol, Side, Quantity, Price, Status, Time
    - Real-time order status updates
  - **Trades Tab:**
    - Fetch trade history from Binance Testnet API
    - Columns: Symbol, Side, Quantity, Price, Realized PnL, Time
  - Status indicators with appropriate colors
  - Real-time updates via WebSocket

- **Responsive Design:**
  - Works on desktop, tablet, mobile
  - Chart should be responsive
  - Layout adapts to screen size while maintaining design integrity

### 3. Real-Time Data Handling

**WebSocket Connections:**
- Connect to Binance Testnet WebSocket: `wss://testnet.binance.vision/ws`
- Subscribe to:
  - Trade streams: `{symbol}@trade` (for real-time prices)
  - Kline streams: `{symbol}@kline_1m` (for chart updates)
- Handle WebSocket lifecycle:
  - Proper connection management
  - Reconnection logic
  - Cleanup on component unmount
- **Critical:** When symbol changes, unsubscribe from old symbol and subscribe to new symbol

**REST API Integration:**
- Account information: `GET /api/v3/account`
- Place order: `POST /api/v3/order`
- Get open orders: `GET /api/v3/openOrders`
- Get positions: `GET /fapi/v2/positionRisk` (for futures) or calculate from trades
- Get trade history: `GET /api/v3/myTrades`
- Get klines: `GET /api/v3/klines`

### 4. Design Language

Follow the provided trading platform design structure exactly. The UI should match the reference design in:
- Layout structure (header, left panel for order entry, right panel for chart/positions)
- Color scheme and styling
- Component placement and spacing
- Typography and visual hierarchy
- Responsive breakpoints

Use Tailwind CSS for styling to match the design system.

---

## Technical Evaluation Criteria

### Frontend Architecture (Critical)

**Strong Signal:**
- Efficient WebSocket handling (proper connection management)
- Chart updates without full re-renders (memoization)
- Proper state management (price data vs UI state vs order state)
- Optimistic UI updates for orders
- Error boundaries and loading states
- Responsive design that works on mobile
- Design matches provided reference
- Chart automatically updates when symbol changes
- Proper cleanup of WebSocket connections
- Secure API key handling

**Red Flags:**
- Chart re-renders on every price update
- Multiple WebSocket connections for same data
- No cleanup on component unmount
- Storing API keys in code or insecure storage
- Design does not match reference structure
- Chart does not update when symbol changes
- Memory leaks from WebSocket connections

### Code Quality

- Clean, readable code
- Proper error handling
- TypeScript types (no `any`)
- Consistent code style
- Meaningful commit messages
- Proper component structure

---

## What You Must Explain During Interview

You will be asked to explain:

1. **How you manage WebSocket connections and prevent memory leaks**
2. **How chart updates are optimized (why memoization is needed)**
3. **How the chart automatically updates when symbol changes**
4. **Your state management approach (price data vs orders vs UI state)**
5. **How you handle API key security**
6. **How you'd scale this UI to handle 50+ symbols simultaneously**
7. **What happens if Binance WebSocket disconnects**
8. **How you prevent unnecessary re-renders**
9. **Your component architecture and why you structured it that way**

---

## Submission Requirements

1. **GitHub Classroom Repository:**
   - Submit via GitHub Classroom link provided
   - Clean commit history
   - Frontend-only repository
   - README at root with:
     - Architecture overview (diagram preferred)
     - Setup instructions
     - Environment variables documentation
     - API integration details
     - Trade-offs made
     - What you'd improve with more time
     - Any LLM-generated code sections clearly marked
     - API key storage strategy explanation

2. **Local Development:**
   - Application must run locally with `npm run dev` or `pnpm dev`
   - Include clear setup instructions in README
   - Provide `.env.example` file
   - Do NOT commit actual API keys

3. **Demo Video:**
   - Create a 2-minute quick recording demonstrating the system working
   - Show key features:
     - API key configuration
     - Symbol selection and chart automatic updates
     - Placing an order
     - Real-time price updates
     - Positions/Orders/Trades table updates
     - Responsive design on different screen sizes
   - Upload to YouTube (unlisted) or similar platform
   - Include video link in README

---

## Bonus Features (Strongly Weighted)

- Order cancellation functionality
- Limit order support
- Stop market order support
- Price alerts/notifications
- Dark/light theme toggle
- URL-based routing (e.g., `/trade/BTCUSDT`)
- Keyboard shortcuts for trading
- Virtualized tables for large datasets
- Skeleton loading states
- Error boundaries with retry logic
- Optimistic UI updates for orders
- Chart drawing tools (trend lines, etc.)

---

## Important Notes

- **This is a testnet assignment for evaluation purposes only**
- **This is NOT a real trading system and should not be used with real funds**
- **You may use LLMs for assistance (up to 20% of work)**, but:
  - You must understand every line of code
  - We will ask you to modify code live
  - We will question architectural decisions
  - Inability to explain = automatic rejection

- **This assignment mirrors real trading UI systems**
- **We evaluate engineering judgment, not just output**
- **Focus on correctness and architecture over fancy UI**
- **Design must match the provided reference structure**
- **No backend deployment required — local development only**

---

## Getting Started

1. **Set up Binance Testnet account:**
   - Go to https://testnet.binance.vision/
   - Generate API keys
   - Store in `.env.local` file

2. **Binance Testnet Endpoints:**
   - REST API: `https://testnet.binance.vision/api`
   - WebSocket: `wss://testnet.binance.vision/ws`
   - Documentation: https://testnet.binance.vision/

3. **Project Setup:**
   - Initialize Next.js project with TypeScript
   - Install required dependencies:
     - `lightweight-charts`
     - `ws` or native WebSocket API
     - Tailwind CSS
   - Set up environment variables

4. **API Key Management:**
   - Create settings page for API key configuration
   - Implement secure storage strategy
   - Add API key validation

---

## Repository Structure

Your repository should follow this structure:

```
your-repo/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Trade panel
│   │   ├── settings/     # API key settings
│   │   └── ...
│   ├── components/       # React components
│   │   ├── Chart/
│   │   ├── OrderPanel/
│   │   ├── PositionsTable/
│   │   └── ...
│   ├── hooks/           # Custom hooks
│   │   ├── useWebSocket.ts
│   │   ├── useBinanceAPI.ts
│   │   └── ...
│   ├── lib/             # Utilities
│   │   ├── binance.ts
│   │   ├── websocket.ts
│   │   └── ...
│   └── types/           # TypeScript types
├── public/
├── .env.example
├── .env.local           # Your API keys (gitignored)
├── package.json
├── README.md
└── .gitignore
```

---

## Deadline

**Sunday, December 21, 2025 at 11:59 PM**

Submit via GitHub Classroom before the deadline. Late submissions will not be accepted.

---

Good luck! We're looking forward to seeing your solution.