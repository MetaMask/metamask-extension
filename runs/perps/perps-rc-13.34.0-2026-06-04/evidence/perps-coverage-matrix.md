# Perps v13.41.0 — E2E Coverage Matrix

**Date**: 2026-07-17  
**Branch**: `release/13.41.0`  
**Test build CI run**: 29529958972

---

## Coverage Summary

| Area | Active Tests | Skipped | Coverage Level |
|------|-------------|---------|----------------|
| Position lifecycle (open/close) | 9 | 2 | HIGH |
| Take-profit / Stop-loss | 2 | 0 | HIGH |
| Activity (filters, navigation) | 7 | 0 | HIGH |
| Watchlist (add/remove/multi) | 3 | 0 | HIGH |
| Withdraw (legacy + confirmation) | 6 | 0 | HIGH |
| Geo-block (blocked + eligible) | 2 | 0 | HIGH |
| Home page legacy flows | 0 | 8 | NONE (stale spec) |

---

## Detailed Test Matrix

### Position Lifecycle (`perps-position-lifecycle.spec.ts`)

| Test | WebSocket Mock | Key Assertions | Status |
|------|----------------|----------------|--------|
| Opens long → closes | `WS_USER_WITH_FUNDED_ACCOUNT` | Position update pushed, CTA buttons reappear, activity shows "Closed long" | ACTIVE |
| Opens short → closes | `WS_USER_WITH_FUNDED_ACCOUNT` | Position update pushed, CTA buttons reappear, activity shows "Closed short" | ACTIVE |
| Partially closes 50% ETH long | `WS_USER_WITH_ETH_LONG_POSITION` | Size updates to 1.25 ETH, activity shows "Closed long" | ACTIVE |
| Reduces exposure via Modify | `WS_USER_WITH_ETH_LONG_POSITION` | Size updates to 2.25 ETH, activity shows "Closed long" | ACTIVE |
| Adds exposure via Modify | `WS_USER_WITH_ETH_LONG_POSITION` | Size updates to 2.5667 ETH | ACTIVE |
| Adds margin — liq price updates | `WS_USER_WITH_ETH_LONG_POSITION` | Liq price changes from 2,400 → 2,320 | ACTIVE |
| Removes margin — liq price updates | `WS_USER_WITH_ETH_LONG_POSITION` | Liq price changes from 2,400 → 2,480 | ACTIVE |
| Position card visible on home | `WS_USER_WITH_ETH_LONG_POSITION` | Card shows 2.5 ETH | ACTIVE |
| Click position card → market detail | `WS_USER_WITH_ETH_LONG_POSITION` | Navigates, position size 2.5 ETH | ACTIVE |
| Reverses ETH long → short | `WS_USER_WITH_ETH_LONG_POSITION` | _(broken upstream — skipped)_ | SKIPPED |
| Reverses BTC short → long | `WS_USER_WITH_BTC_SHORT_POSITION` | _(broken upstream — skipped)_ | SKIPPED |

### Take Profit / Stop Loss (`perps-tpsl.spec.ts`)

| Test | Mock | Key Assertions | Status |
|------|------|----------------|--------|
| TP fill: set TP on ETH long, stream clears position | `WS_USER_WITH_ETH_LONG_POSITION` | Auto-close row shows 3,500; position cleared; activity "Closed long" | ACTIVE |
| SL fill: set SL on ETH long, stream clears position | `WS_USER_WITH_ETH_LONG_POSITION` | Auto-close row shows 2,500; position cleared; activity "Closed long" | ACTIVE |

### Activity (`perps-activity.spec.ts`)

| Test | Mock | Key Assertions | Status |
|------|------|----------------|--------|
| Shows all 4 filter options | `WS_WITH_ACTIVITY_DATA` | Trades, Orders, Funding, Deposits visible | ACTIVE |
| Filter: Trades | `WS_WITH_ACTIVITY_DATA` | Trade cards show "Opened long" | ACTIVE |
| Filter: Orders | `WS_WITH_ACTIVITY_DATA` | Order cards visible | ACTIVE |
| Filter: Funding | `WS_WITH_ACTIVITY_DATA` | Funding cards visible | ACTIVE |
| Filter: Deposits | `WS_WITH_ACTIVITY_DATA` | Deposit cards visible | ACTIVE |
| Click order → market detail | `WS_WITH_ACTIVITY_DATA` | Market detail page loads | ACTIVE |
| Recent activity section on home | `WS_WITH_ACTIVITY_DATA` | Non-empty recent-activity section | ACTIVE |

### Watchlist (`perps-watchlist.spec.ts`)

| Test | Key Assertions | Status |
|------|----------------|--------|
| Add BTC to watchlist | BTC appears in home watchlist section with filled star | ACTIVE |
| Remove ETH from watchlist | Watchlist section disappears | ACTIVE |
| Add ETH + AVAX | Both appear in home watchlist | ACTIVE |

### Withdraw (`perps-withdraw.spec.ts`)

| Test | Flow | Key Assertions | Status |
|------|------|----------------|--------|
| Page loads | Legacy page | Header + summary rows visible | ACTIVE |
| Submit valid withdrawal | Legacy page | Success toast shown | ACTIVE |
| Submit disabled at zero | Legacy page | Button disabled | ACTIVE |
| Validation error on excess | Legacy page | "exceeds" validation message | ACTIVE |
| Submit valid withdrawal | Confirmation flow | Success toast; destination USDC | ACTIVE |
| Block above available balance | Confirmation flow | Insufficient funds reason shown | ACTIVE |

### Geo-block (`perps-geo-block.spec.ts`)

| Test | Config | Key Assertions | Status |
|------|--------|----------------|--------|
| Geo-blocked: Add Funds → modal | `perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: ['US'] }` | Geo-block modal appears; dismissed on "Got it" | ACTIVE |
| Eligible: Long → order entry | `perpsPerpTradingGeoBlockedCountriesV2: { blockedRegions: [] }` | Order entry opens without modal | ACTIVE |

---

## Mock Infrastructure

All tests use the local WebSocket registry (`WebSocketRegistry`) to inject Hyperliquid mock data:

- `WS_USER_WITH_FUNDED_ACCOUNT` — clearinghouseState with $10,000 balance, no positions
- `WS_USER_WITH_ETH_LONG_POSITION` — 2.5 ETH long at $2,850, 3x leverage
- `WS_USER_WITH_BTC_SHORT_POSITION` — BTC short position, 15x leverage
- `WS_WITH_ACTIVITY_DATA` — fills, open orders, funding payments, deposit entries

HTTP mocks intercept:
- `https://api.hyperliquid.xyz/info` — position/order/funding/ledger responses
- `https://client-config.api.cx.metamask.io/v1/flags` — eligible/geo-blocked flag sets
- `https://api.relay.link/quote` + `/authorize` + `/intents/status/v3` — withdraw confirmation flow

---

## Gaps Identified

1. **Reverse position flows** — 2 tests skipped; upstream perps-controller fix required
2. **Order book UI** — No E2E coverage for the order book view (introduced via `feat/perps-order-book`, not yet in release branch)
3. **Privacy mode** — No dedicated E2E for open-order privacy masking (fix #44432 covered by unit tests only)
4. **Deposit first-open skeleton** — No specific E2E for the skeleton regression (#44247); the deposit path is exercised indirectly
5. **Order summary tooltips** — No E2E for tooltip visibility (#44290); display-only, low risk
