# Perps Screens & Views Documentation

Architectural reference for Perps screens in MetaMask Extension.

> **Note:** This document was adapted from mobile. The extension has more screen real estate, allowing us to consolidate multiple mobile screens into single views. Modals should be used sparingly—only for quick explicit actions, not as part of happy path flows.

## Extension Routing

Routes are defined in `ui/helpers/constants/routes.ts`:

```typescript
// Example route structure (to be implemented)
export const PERPS_ROUTE = '/perps';
export const PERPS_MARKET_ROUTE = '/perps/market';
export const PERPS_ORDER_ROUTE = '/perps/order';
export const PERPS_POSITIONS_ROUTE = '/perps/positions';
export const PERPS_TRANSACTIONS_ROUTE = '/perps/transactions';
```

The extension uses React Router v6 with `useNavigate()` and `useLocation()`. See `ui/pages/swaps/index.js` for a reference implementation of nested routes.

## Table of Contents

1. [PerpsPage](#perpspage) - Main container (extension entry point)
2. [PerpsHome](#perpshome) - Landing screen
3. [PerpsMarketList](#perpsmarketlist) - Market browser
4. [PerpsMarketDetails](#perpsmarketdetails) - Market detail with trading
5. [PerpsOrder](#perpsorder) - Order entry
6. [PerpsPositions](#perpspositions) - Positions list with actions
7. [PerpsClosePosition](#perpscloseposition) - Close position
8. [PerpsAdjustMargin](#perpsadjustmargin) - Adjust margin
9. [PerpsTPSL](#perpstpsl) - TP/SL management
10. [PerpsTransactions](#perpstransactions) - Transaction history
11. [PerpsWithdraw](#perpswithdraw) - Withdrawal
12. [PerpsHeroCard](#perpsherocard) - Share cards
13. [PerpsEmptyState](#perpsemptystate) - Empty states

**Consolidated from mobile:** Close All Positions and Cancel All Orders are now inline actions within PerpsHome/PerpsPositions, not separate modal screens.

---

## PerpsPage

**Location:** `ui/pages/perps/perps-page.tsx`

### Purpose & User Journey

Main container for Perps trading interface. Uses React Router v6 for nested route handling. Acts as the entry point when user navigates to `/perps`.

### Key Components Used

- React Router `<Routes>` and `<Route>` for nested navigation
- Screen components rendered based on active route

### Hooks Consumed

- `useNavigate()` - React Router navigation
- `useLocation()` - Current route state
- `usePerpsConnection` - Connection state management

### Data Flow

- Entry via route navigation (`/perps`)
- Nested routes handle sub-screens (market details, order, etc.)
- Connection provider wraps all Perps content

### Navigation

- Entry point: User navigates to `/perps` route
- Destinations: All nested Perps routes
- Exit: User navigates to different route (`/` home, `/swaps`, etc.)

---

## PerpsHome

**Location:** `ui/pages/perps/perps-home/perps-home.tsx`

### Purpose & User Journey

Landing screen for Perps trading. Displays aggregated trading overview including positions, open orders, watchlist markets, and recent activity. Single entry point to all trading actions.

### Key Components Used

| Component                   | Purpose                                 | Location                   |
| --------------------------- | --------------------------------------- | -------------------------- |
| `PerpsMarketBalanceActions` | Balance & deposit section               | `ui/components/app/perps/` |
| `PerpsCard`                 | Featured trading card                   | `ui/components/app/perps/` |
| `PerpsWatchlistMarkets`     | User watchlist                          | `ui/components/app/perps/` |
| `PerpsMarketTypeSection`    | Market categories (Crypto/Stocks/Forex) | `ui/components/app/perps/` |
| `PerpsRecentActivityList`   | Recent trades & orders                  | `ui/components/app/perps/` |
| `PerpsHomeHeader`           | Header with balance display             | `ui/components/app/perps/` |

**Close All / Cancel All:** These are inline action buttons with confirmation, not separate modal screens. On extension we have more space to show confirmation inline or use a simple confirmation dialog.

### Hooks Consumed

| Hook                    | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `usePerpsHomeData`      | Fetches positions, orders, markets, activity |
| `useNavigate`           | React Router navigation                      |
| `usePerpsMeasurement`   | Performance tracking                         |
| `usePerpsEventTracking` | Analytics events                             |

### Data Flow

```
Redux + WebSocket (via usePerpsHomeData)
    ↓
Positions, Orders, Markets (real-time)
    ↓
PerpsHome renders sections
    ↓
User navigates to detail screens or executes inline actions
```

### Navigation

- **From:** `/perps` route
- **To:**
  - `/perps/market/:marketId` (tap market)
  - `/perps/order` (new trade)
  - `/perps/positions` (view all positions)
- **Analytics:** Tracks screen view with source (navigation or deep link)

---

## PerpsMarketList

**Location:** `ui/pages/perps/perps-market-list/perps-market-list.tsx`

### Purpose & User Journey

Browsable market list with search, sorting, filtering by market type. User discovers new markets and filters by asset class (Crypto/Stocks/Commodities/Forex).

### Key Components Used

| Component                   | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `PerpsMarketList`           | Market list (consider virtualization for 100+ items) |
| `PerpsMarketFiltersBar`     | Asset type filter tabs                               |
| `PerpsMarketSortDropdown`   | Sort options (inline dropdown, not modal)            |
| `PerpsMarketListHeader`     | Header with search input                             |
| `PerpsMarketBalanceActions` | Balance section                                      |
| `PerpsMarketRowSkeleton`    | Loading skeleton                                     |

**Consolidation note:** Sort and filter options are inline controls (dropdowns, tabs) rather than separate modal screens. Extension has sufficient space for these controls to be visible.

### Hooks Consumed

| Hook                     | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `usePerpsMarketListView` | All market filtering, sorting, search logic |
| `usePerpsMeasurement`    | Performance tracking                        |
| `usePerpsEventTracking`  | Analytics                                   |
| `useNavigate`            | React Router navigation                     |

### Data Flow

```
usePerpsMarketListView hook:
  ├─ Fetches all markets
  ├─ Filters by: search, type (crypto/stocks/forex), favorites
  ├─ Sorts by: price change, volume, interest
  └─ Returns: filteredMarkets[], marketCounts

User interactions:
  ├─ Search → real-time filter
  ├─ Sort → reorder list
  ├─ Type filter → category filter
  └─ Tap market → navigate to /perps/market/:marketId
```

### Navigation

- **From:** `/perps` home
- **To:** `/perps/market/:marketId` (click market row)

---

## PerpsMarketDetails

**Location:** `ui/pages/perps/perps-market-details/perps-market-details.tsx`

### Purpose & User Journey

Detailed market view with TradingView chart, market stats, and trading interface. User analyzes price action and executes trades for a single market.

**Consolidation opportunity:** With extension's larger viewport, consider showing the order form alongside the chart (split view) rather than navigating to a separate order screen.

### Key Components Used

| Component                   | Purpose                            |
| --------------------------- | ---------------------------------- |
| `PerpsMarketHeader`         | Title, price, 24h change           |
| `TradingViewChart`          | Chart with multiple timeframes     |
| `PerpsCandlePeriodSelector` | Candle period (1m, 5m, 1h, 4h, 1d) |
| `PerpsMarketTabs`           | Info/Orders/Positions tabs         |
| `PerpsNavigationCard`       | Quick action buttons               |
| `PerpsOICapWarning`         | OI capacity warning                |
| `PerpsMarketHoursBanner`    | Trading hours status               |
| `PerpsMarketBalanceActions` | Balance info                       |

**Flip position:** Confirmation can be an inline confirmation state or simple dialog, not a separate modal screen.

### Hooks Consumed

| Hook                                        | Purpose                         |
| ------------------------------------------- | ------------------------------- |
| `useParams`                                 | Get marketId from route         |
| `usePerpsPositionData`                      | Fetch position for this market  |
| `usePerpsMarketStats`                       | Market statistics (funding, OI) |
| `useHasExistingPosition`                    | Check if user has position      |
| `usePerpsOICap`                             | OI cap checking                 |
| `usePerpsDataMonitor`                       | Data consistency monitoring     |
| `usePerpsMeasurement`                       | Performance tracking            |
| `usePerpsLiveOrders`, `usePerpsLiveAccount` | Real-time updates               |

### Data Flow

```
Route params: /perps/market/:marketId
    ↓
usePerpsMarketStats → Statistics
usePerpsPositionData → Existing position
usePerpsDataMonitor → Data consistency
    ↓
Render: Chart + Stats + Tabs
    ↓
User actions:
  ├─ Trade → /perps/order (or inline order form)
  ├─ Close position → /perps/close/:positionId
  └─ Set TP/SL → /perps/tpsl/:positionId
```

### Navigation

- **From:** `/perps` or `/perps/markets`
- **To:**
  - `/perps/order?market=:marketId` (new order)
  - `/perps/close/:positionId` (close existing)
  - `/perps/tpsl/:positionId` (TP/SL settings)

---

## PerpsOrder

**Location:** `ui/pages/perps/perps-order/perps-order.tsx`

### Purpose & User Journey

Order placement interface. User specifies trade parameters: direction (long/short), amount (USD or size), leverage, and optional limit price. Final review before execution.

### Key Components Used

| Component              | Purpose                               |
| ---------------------- | ------------------------------------- |
| `PerpsOrderHeader`     | Market info (asset, price, change)    |
| `PerpsAmountInput`     | USD amount input field                |
| `PerpsSlider`          | Leverage/amount slider                |
| `PerpsFeesDisplay`     | Estimated fees breakdown              |
| `PerpsLimitPriceInput` | Limit price input (inline, not modal) |

**Input:** Standard text inputs with validation. No numeric keypad needed on web.

### Hooks Consumed

| Hook                    | Purpose               |
| ----------------------- | --------------------- |
| `usePerpsOrderForm`     | Form state management |
| `usePerpsOrderFees`     | Fee calculation       |
| `usePerpsRewards`       | Rewards & discounts   |
| `usePerpsValidation`    | Form validation       |
| `usePerpsLivePrices`    | Real-time price feed  |
| `usePerpsMeasurement`   | Performance tracking  |
| `usePerpsEventTracking` | Analytics             |

### Data Flow

```
Route: /perps/order?market=:marketId&type=market|limit

Form state:
  ├─ amount (USD)
  ├─ leverage
  ├─ orderType
  ├─ limitPrice (if limit order)
  └─ direction (long/short)

usePerpsOrderFees:
  ├─ Calculates trading fee
  ├─ Applies fee discount
  └─ Shows rewards

User action:
  ├─ Enter amount → text input
  ├─ Set leverage → slider or input
  ├─ Set limit price → inline input
  └─ Confirm → Execute order
```

### Navigation

- **From:** `/perps/market/:marketId` (Trade button)
- **To:** `/perps/tpsl/:positionId` (optional, after order placed)
- **Back:** Returns to market details

---

## PerpsPositions

**Location:** `ui/pages/perps/perps-positions/perps-positions.tsx`

### Purpose & User Journey

List of all open positions. User views position details, total P&L, and can initiate close or TP/SL updates.

**Consolidation:** Close All Positions action is an inline button with confirmation, not a separate screen.

### Key Components Used

| Component           | Purpose                     |
| ------------------- | --------------------------- |
| `PerpsPositionCard` | Individual position card    |
| `PerpsPositionRow`  | Compact row for table view  |
| Utility functions   | PnL calculation, formatting |

### Hooks Consumed

| Hook                    | Purpose                       |
| ----------------------- | ----------------------------- |
| `usePerpsLivePositions` | Fetch all positions real-time |
| `usePerpsLiveAccount`   | Account state (margin, etc.)  |
| `useNavigate`           | React Router navigation       |

### Data Flow

```
usePerpsLivePositions (WebSocket):
  └─ Returns: positions[], isInitialLoading

Calculate:
  ├─ Total unrealized P&L
  ├─ Total margin used
  └─ Position count

Render:
  ├─ Positions list/table
  ├─ Total P&L summary
  └─ Per-position action buttons
```

### Navigation

- **From:** `/perps` home
- **To:**
  - `/perps/close/:positionId` (close position)
  - `/perps/tpsl/:positionId` (set TP/SL)
  - `/perps/market/:marketId` (view market)

---

## PerpsClosePosition

**Location:** `ui/pages/perps/perps-close-position/perps-close-position.tsx`

### Purpose & User Journey

Interface to close existing position (fully or partially). User specifies close amount/percentage and optional limit price. Shows estimated fees and receive amount.

### Key Components Used

| Component              | Purpose                          |
| ---------------------- | -------------------------------- |
| `PerpsOrderHeader`     | Position info                    |
| `PerpsAmountInput`     | Close amount input               |
| `PerpsSlider`          | Close percentage slider          |
| `PerpsCloseSummary`    | Fee and receive amount breakdown |
| `PerpsLimitPriceInput` | Limit price input (inline)       |

### Hooks Consumed

| Hook                              | Purpose                   |
| --------------------------------- | ------------------------- |
| `useParams`                       | Get positionId from route |
| `usePerpsClosePosition`           | Close position execution  |
| `usePerpsClosePositionValidation` | Validation logic          |
| `usePerpsOrderFees`               | Fee calculation           |
| `usePerpsRewards`                 | Rewards calculation       |
| `usePerpsLivePrices`              | Real-time prices          |
| `usePerpsMeasurement`             | Performance tracking      |

### Data Flow

```
Route: /perps/close/:positionId

State:
  ├─ closePercentage (0-100)
  ├─ closeAmountUSD
  ├─ orderType ('market' | 'limit')
  └─ limitPrice (optional)

Calculations:
  ├─ closeAmount = position.size * (closePercentage / 100)
  ├─ closingValue = positionValue * (closePercentage / 100)
  ├─ effectivePnL = calculated based on effective price
  └─ receiveAmount = margin + pnl - fees

User action: Confirm → handleClosePosition()
```

### Navigation

- **From:** `/perps/positions` or `/perps/market/:marketId`
- **To:** `/perps/market/:marketId` (after close)

---

## Bulk Actions (Consolidated)

> **Note:** Close All Positions and Cancel All Orders are **not separate screens** in the extension. They are implemented as:
>
> - Inline action buttons within PerpsPositions or PerpsHome
> - Simple confirmation dialogs (not modal flows)
> - Direct execution with toast feedback

### Implementation Pattern

```typescript
// Example: Close All Positions button with confirmation
const handleCloseAll = async () => {
  const confirmed = await showConfirmDialog({
    title: 'Close All Positions',
    message: `Close ${positions.length} positions for estimated ${totalPnL}?`,
  });

  if (confirmed) {
    await closeAllPositions();
    showToast({ message: 'All positions closed' });
  }
};
```

### Hooks Used

| Hook                           | Purpose                |
| ------------------------------ | ---------------------- |
| `usePerpsCloseAllCalculations` | Aggregate calculations |
| `usePerpsCloseAllPositions`    | Execution hook         |
| `usePerpsCancelAllOrders`      | Cancel all orders      |
| `usePerpsToasts`               | Success/error feedback |

---

## PerpsTPSL

**Location:** `ui/pages/perps/perps-tpsl/perps-tpsl.tsx`

### Purpose & User Journey

Editor for Take Profit and Stop Loss price levels. Supports entry by price or percentage (ROE). Shows expected profit/loss. Used for new orders or position management.

### Key Components Used

| Component                                    | Purpose              |
| -------------------------------------------- | -------------------- |
| `PerpsPriceInput`                            | Price input field    |
| `PerpsPercentageInput`                       | ROE percentage input |
| Utility: `formatPerpsFiat`, `PRICE_RANGES_*` | Display formatting   |

### Hooks Consumed

| Hook                       | Purpose                     |
| -------------------------- | --------------------------- |
| `useParams`                | Get positionId from route   |
| `usePerpsTPSLForm`         | All form state & validation |
| `usePerpsLivePrices`       | Real-time market price      |
| `usePerpsLiquidationPrice` | Calculate liquidation level |
| `usePerpsEventTracking`    | Analytics                   |

### Data Flow

```
Route: /perps/tpsl/:positionId (or query params for new orders)

Form state (usePerpsTPSLForm):
  ├─ takeProfitPrice & percentage
  ├─ stopLossPrice & percentage
  ├─ validation errors
  └─ expected P&L

Pricing:
  ├─ Use live price if available
  ├─ Fall back to entry price for existing position
  └─ Use limit price for limit orders

User action: Confirm → save TP/SL and navigate back
```

### Navigation

- **From:** `/perps/order` or `/perps/market/:marketId`
- **To:** Previous screen (navigate back)

---

## PerpsAdjustMargin

**Location:** `ui/pages/perps/perps-adjust-margin/perps-adjust-margin.tsx`

### Purpose & User Journey

Unified view for adjusting position margin (add or remove). Mode parameter determines behavior: add mode increases margin to reduce leverage; remove mode decreases margin to free collateral. Slider-based selection with live impact preview and risk warnings for remove mode.

### Key Components Used

| Component            | Purpose             |
| -------------------- | ------------------- |
| `PerpsSlider`        | Amount selector     |
| `PerpsAmountInput`   | Direct amount input |
| `PerpsOrderHeader`   | Asset info & price  |
| `PerpsRiskIndicator` | Risk level display  |

### Hooks Consumed

| Hook                       | Purpose                               |
| -------------------------- | ------------------------------------- |
| `useParams`                | Get positionId and mode from route    |
| `usePerpsMarginAdjustment` | Unified margin adjustment with toasts |
| `usePerpsLiveAccount`      | Available balance (add mode)          |
| `usePerpsMarkets`          | Max leverage (remove mode)            |
| `usePerpsLivePrices`       | Current market price                  |
| `usePerpsMeasurement`      | Performance tracking with mode tag    |

### Data Flow

```
Route: /perps/margin/:positionId?mode=add|remove

Add mode: availableBalance → maxAmount
Remove mode: calculateMaxRemovableMargin() → maxAmount
User adjusts → Preview new margin/leverage/liq price
Remove mode: assessMarginRemovalRisk() → risk level (safe/warning/danger)
Confirm → handleAddMargin() or handleRemoveMargin()
```

### Navigation

- **From:** `/perps/market/:marketId` (position actions)
- **To:** Navigates back on success

---

## PerpsTransactions

**Location:** `ui/pages/perps/perps-transactions/perps-transactions.tsx`

### Purpose & User Journey

Historical transaction log with filterable tabs: Trades, Orders, Funding, Deposits/Withdrawals. User reviews trading history.

### Key Components Used

| Component                   | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `PerpsTransactionList`      | Transaction list (virtualize for 100+ items) |
| `PerpsTransactionItem`      | Individual transaction row                   |
| `PerpsTransactionsSkeleton` | Loading state                                |
| Tab/filter controls         | Filter by transaction type                   |

### Hooks Consumed

| Hook                         | Purpose                |
| ---------------------------- | ---------------------- |
| `usePerpsTransactionHistory` | Fetch all transactions |
| `usePerpsConnection`         | Connection state       |
| `usePerpsMeasurement`        | Performance tracking   |

### Data Flow

```
usePerpsTransactionHistory:
  └─ Fetch: trades, orders, funding, deposits/withdrawals

Grouping:
  ├─ Group by date
  └─ Render grouped list

Filtering:
  ├─ User selects filter (Trades/Orders/Funding/Deposits)
  └─ Filter transactions by type

Expansion:
  └─ Click row to expand inline details (no separate detail screens needed)
```

**Consolidation:** Transaction details can be shown inline (expandable rows) rather than navigating to separate detail screens.

### Navigation

- **From:** `/perps` home
- **To:** Inline expansion for details

---

## PerpsWithdraw

**Location:** `ui/pages/perps/perps-withdraw/perps-withdraw.tsx`

### Purpose & User Journey

Withdrawal flow to move USDC from Perps account back to mainchain wallet. User enters amount, sees fees, and confirms. Immediate navigation on confirm.

### Key Components Used

| Component          | Purpose            |
| ------------------ | ------------------ |
| `PerpsAmountInput` | Amount text input  |
| `AvatarToken`      | USDC token display |
| `Badge`            | Network badge      |
| `Tooltip`          | Info tooltips      |
| `KeyValueRow`      | Fee/time display   |

### Hooks Consumed

| Hook                    | Purpose                     |
| ----------------------- | --------------------------- |
| `usePerpsLiveAccount`   | Get available balance       |
| `usePerpsWithdrawQuote` | Fee calculation             |
| `useWithdrawValidation` | Validation (min/max)        |
| `useWithdrawTokens`     | Get destination token/chain |
| `usePerpsEventTracking` | Analytics                   |
| `usePerpsMeasurement`   | Performance                 |

### Data Flow

```
Mount:
  ├─ Fetch account balance
  ├─ Fetch destination token (USDC on Arbitrum)
  └─ Display available balance

User input:
  ├─ Enter amount via text input
  ├─ Or click 25/50/75/Max percentage buttons
  └─ Validation: min $10, max available

Confirm:
  ├─ Call controller.withdraw()
  ├─ Navigate back immediately
  └─ Async execution with toast feedback

Result:
  ├─ Success/error toast
  └─ Balance update via WebSocket
```

### Navigation

- **From:** `/perps` home (withdraw button)
- **To:** Back to `/perps` (immediate)

---

## PerpsHeroCard

**Location:** `ui/pages/perps/perps-hero-card/perps-hero-card.tsx`

### Purpose & User Journey

Celebratory card display for profitable positions. User can view themed card, customize with optional referral code, and share to social media.

### Key Components Used

| Component                | Purpose                       |
| ------------------------ | ----------------------------- |
| `PerpsCardCarousel`      | Card selection (click/arrows) |
| `html2canvas`            | Capture card as image (web)   |
| Web Share API            | Share to social apps          |
| `RewardsReferralCodeTag` | Referral code display         |
| `PerpsTokenLogo`         | Market asset logo             |

### Hooks Consumed

| Hook                                 | Purpose                   |
| ------------------------------------ | ------------------------- |
| `useParams`                          | Get positionId from route |
| `usePerpsEventTracking`              | Share analytics           |
| `usePerpsToasts`                     | Share feedback            |
| Redux selector: `selectReferralCode` | Get user's referral code  |

### Data Flow

```
Route: /perps/share/:positionId

Data used:
  ├─ position.unrealizedPnl (ROE calculation)
  ├─ position.leverage
  ├─ position.entryPrice
  ├─ marketPrice (for mark price display)
  └─ position.coin (asset symbol)

Card selection:
  ├─ 4 PNL character images
  ├─ Click arrows or thumbnails to change
  └─ Selection indicator

Share:
  ├─ Capture current card as image (html2canvas)
  ├─ Include referral code if available
  ├─ Use Web Share API or download fallback
  └─ Track success/failure
```

### Navigation

- **From:** `/perps` home or `/perps/positions` (share button)
- **To:** Navigates back after share
- **Analytics:** Track card view, share attempts

---

## PerpsEmptyState

**Location:** `ui/components/app/perps/perps-empty-state/perps-empty-state.tsx`

### Purpose & User Journey

Reusable empty state component shown when no positions exist. Encourages user to start trading.

### Key Components Used

| Component    | Purpose                   |
| ------------ | ------------------------- |
| `Box`        | Layout container          |
| Image assets | Theme-aware illustrations |
| `Button`     | CTA button                |

### Hooks Consumed

| Hook       | Purpose               |
| ---------- | --------------------- |
| `useTheme` | Theme-specific images |

### Data Flow

```
Props: { onActionPress?, testID? }

Render:
  ├─ Theme image (light/dark)
  ├─ "Start trading" message
  └─ CTA button (optional)

Action:
  └─ onActionPress() → Navigate to market list
```

### Navigation

- **From:** PerpsPositions or PerpsHome (when empty)
- **To:** `/perps/markets` (action button)

---

## PerpsLoader

**Location:** `ui/components/app/perps/perps-loader/perps-loader.tsx`

### Purpose & User Journey

Loading state shown during Perps initialization. Displayed while WebSocket connects and initial data loads.

### Key Components Used

| Component | Purpose           |
| --------- | ----------------- |
| `Spinner` | Loading indicator |
| `Text`    | Status message    |

### Hooks Consumed

| Hook                 | Purpose                  |
| -------------------- | ------------------------ |
| `usePerpsConnection` | Monitor connection state |

### Data Flow

```
Connection states:
  ├─ "Initializing..." - Initial state
  ├─ "Connecting..." - WebSocket connecting
  └─ Connected - Render children
```

The loader wraps Perps content and shows loading state until connection is established.

---

## Debug Views

**Location:** `ui/pages/perps/perps-debug/` (dev builds only)

Development-only debug interface for testing HyperLiquid features. Only accessible in development mode.

### Features

| Feature         | Purpose                            |
| --------------- | ---------------------------------- |
| DEX Selector    | Choose which DEX to test           |
| Market Selector | Choose market on DEX               |
| Balance Check   | View aggregated balances           |
| Manual Transfer | Test transfers between DEXs        |
| Place Order     | Test order with auto-transfer      |
| Close Position  | Test close with auto-transfer back |

---

## Architecture Summary

### Data Layer

All views consume real-time data via:

1. **WebSocket streams** (via hooks):
   - `usePerpsLivePrices` - Price updates
   - `usePerpsLivePositions` - Position updates
   - `usePerpsLiveOrders` - Order updates
   - `usePerpsLiveAccount` - Balance updates

2. **Controller methods** (async):
   - `usePerpsOrderFees` - Fee calculations
   - `usePerpsMarketData` - Market metadata
   - `usePerpsTransactionHistory` - Historical data

3. **Redux** (selectors):
   - User preferences
   - Cached state
   - Referral code

### Navigation Pattern (Extension)

```
/perps (PerpsPage entry point)
  ├→ /perps/markets (browse markets)
  │  └→ /perps/market/:marketId (market details + trading)
  │     ├→ /perps/order (place order)
  │     ├→ /perps/close/:positionId (close position)
  │     └→ /perps/tpsl/:positionId (TP/SL)
  ├→ /perps/positions (manage positions)
  │  ├→ /perps/close/:positionId
  │  ├→ /perps/tpsl/:positionId
  │  └→ /perps/margin/:positionId (adjust margin)
  ├→ /perps/transactions (history)
  ├→ /perps/withdraw (withdraw funds)
  └→ /perps/share/:positionId (hero card)
```

Routes are defined in `ui/helpers/constants/routes.ts` following extension conventions.

### Performance Patterns

- **Throttled prices:** 1000ms for close position, 500ms for TP/SL
- **Virtualized lists:** Consider `react-window` for lists with 100+ items
- **Lazy loading:** Markets load on demand
- **Performance tracking:** `usePerpsMeasurement` hook tracks screen load times

### State Management

- **Ephemeral:** Form inputs, UI state (focused input, etc.)
- **Cached:** Market data, transaction history
- **Real-time:** Prices, positions, orders, balances
- **Persisted:** User preferences (chart candle period, etc.)

### Key Differences from Mobile

| Aspect       | Mobile                 | Extension                              |
| ------------ | ---------------------- | -------------------------------------- |
| Navigation   | React Navigation stack | React Router v6                        |
| Lists        | FlashList              | Standard lists (virtualize 100+ items) |
| Modals       | BottomSheet            | Inline forms, confirmation dialogs     |
| Input        | Keypad components      | Standard text inputs                   |
| Bulk actions | Separate modal screens | Inline with confirmation               |
| Layout       | Single column          | Can use split views                    |
