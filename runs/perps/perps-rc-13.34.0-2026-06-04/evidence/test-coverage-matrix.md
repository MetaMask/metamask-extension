# Perps Test Coverage Matrix — v13.42.0

**Generated:** 2026-07-24
**Build:** metamask-chrome-13.42.0.zip (CI run 30036971851)
**Mode:** Headless mock (WebSocket + HTTP overrides)

---

## Coverage Summary

| Suite | Active | Skipped | PASS | FAIL |
|---|---|---|---|---|
| Position Lifecycle | 9 | 2 | 9 | 0 |
| Activity | 7 | 0 | 7 | 0 |
| Withdraw | 6 | 0 | 6 | 0 |
| Take Profit / Stop Loss | 2 | 0 | 2 | 0 |
| Watchlist | 3 | 0 | 3 | 0 |
| Geo-block | 2 | 0 | 2 | 0 |
| WebSocket Connection | 3 | 0 | 3 | 0 |
| Perps Home (legacy) | 0 | 10 | 0 | 0 |
| **TOTAL** | **32** | **12** | **32** | **0** |

---

## Detailed Test Matrix

### Position Lifecycle

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| PLC-01 | Opens long market order then closes | Long order submitted → position created → position closed → trade CTA visible → activity shows "Closed long" | ✅ PASS |
| PLC-02 | Opens short market order then closes | Short order submitted → position created → position closed → trade CTA visible → activity shows "Closed short" | ✅ PASS |
| PLC-03 | Partially closes 50% of ETH long from homepage | Position card "ETH" visible → market detail loaded → 50% close confirmed → position size updates to 1.25 ETH → activity shows close fill | ✅ PASS |
| PLC-04 | Reduces exposure via Modify menu | ETH position card → market detail → Modify → Reduce Exposure → 10% closed → position size 2.25 ETH → activity shows close fill | ✅ PASS |
| PLC-05 | Adds exposure via Modify menu | ETH position → Modify → Add Exposure → $200 order → position size 2.5667 ETH | ✅ PASS |
| PLC-06 | Reverses ETH long to short | *(skipped — perps-controller v4.0.0 upstream bug)* | ⏭ SKIP |
| PLC-07 | Reverses BTC short to long | *(skipped — same upstream bug)* | ⏭ SKIP |
| PLC-08 | Adds margin — liquidation price updates | ETH position → Margin → Add $250 → liquidation price 2,320 | ✅ PASS |
| PLC-09 | Removes margin | ETH position → Margin → Remove $200 → liquidation price 2,480 | ✅ PASS |
| PLC-10 | Position card visible on home | ETH 2.5 ETH position card shown in positions section | ✅ PASS |
| PLC-11 | Clicking position card navigates to market detail | Position card click → ETH market detail loaded → position size 2.5 ETH | ✅ PASS |

### Activity

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| ACT-01 | Filter dropdown shows all four options | Filter button opened → trade, order, funding, deposit options visible | ✅ PASS |
| ACT-02 | Filters by Trades | Trade filter selected → ETH "Opened long" fill visible | ✅ PASS |
| ACT-03 | Filters by Orders | Order filter selected → order transaction visible | ✅ PASS |
| ACT-04 | Filters by Funding | Funding filter selected → funding transaction visible | ✅ PASS |
| ACT-05 | Filters by Deposits | Deposit filter selected → USDC deposit visible | ✅ PASS |
| ACT-06 | Order card click navigates to market detail | Order card clicked → ETH market detail page loaded | ✅ PASS |
| ACT-07 | Recent activity on home shows trade row | Home with WS activity data → recent activity section not empty | ✅ PASS |

### Withdraw

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| WD-01 | Withdraw page loads with summary rows | Navigate to withdraw → header visible → summary rows visible | ✅ PASS |
| WD-02 | Submits valid withdrawal — success toast | Enter $50 → submit → "withdraw submitted" toast on home | ✅ PASS |
| WD-03 | Submit disabled when amount is zero | Default state → submit button disabled | ✅ PASS |
| WD-04 | Validation error when amount exceeds balance | Enter $99999 → "exceeds" validation message → submit disabled | ✅ PASS |
| WD-05 | Submits valid withdrawal from confirmation flow | Confirmation flow: enter $50 → destination USDC → click Withdraw → success toast | ✅ PASS |
| WD-06 | Blocks withdrawal above available balance | Enter $10001 → insufficient funds reason displayed | ✅ PASS |

### Take Profit / Stop Loss

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| TPSL-01 | Sets Take Profit on ETH long | TP configured → position closed (WS push) → activity shows "Closed long" | ✅ PASS |
| TPSL-02 | Sets Stop Loss on ETH long | SL configured → position closed (WS push) → activity shows "Closed long" | ✅ PASS |

### Watchlist

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| WL-01 | Adds market to watchlist | Market detail → star icon → home shows market in watchlist with filled star | ✅ PASS |
| WL-02 | Removes market from watchlist | Filled star → tap → star empties → market removed from watchlist section | ✅ PASS |
| WL-03 | Watchlist persists across navigation | Navigate away and back → watchlist state preserved | ✅ PASS |

### Geo-block

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| GEO-01 | Geo-blocked: Add funds shows modal | Geo-blocked fixture → Add funds → geo-block modal shown → Got it dismisses | ✅ PASS |
| GEO-02 | Eligible user: Long accessible | Eligible fixture → market detail → Long CTA available, no geo modal | ✅ PASS |

### WebSocket Connection

| ID | Test Name | Assertions | Result |
|---|---|---|---|
| WS-01 | WebSocket connects on Perps home | Navigate to Perps home → WS connection established | ✅ PASS |
| WS-02 | Reconnects after disconnect | Disconnect simulated → reconnect UX shows → reconnected | ✅ PASS |
| WS-03 | Order book stream updates ladder | WS order book push → ladder rows rendered with depth ratio | ✅ PASS |

---

## Pre-existing Skip Inventory

| Suite | Test | Skip Reason |
|---|---|---|
| Position Lifecycle | Reverses ETH long to short | `@metamask/perps-controller` v4.0.0 broke `TradingService.flipPosition()`. `validateOrder()` fails with `ORDER_PRICE_REQUIRED`. Upstream fix required. |
| Position Lifecycle | Reverses BTC short to long | Same upstream blocker. |
| Perps Home (all 10) | All home spec tests | Stale legacy spec — functionality superseded by coverage in position lifecycle, activity, withdraw, and watchlist suites. |

**Total pre-existing skips: 12 — unchanged from v13.41.0 baseline.**

---

## New Feature Coverage Note

### Close Positions with Limit Orders (PR #44466)

This feature is gated by `perpsClosePositionLimitOrderEnabled` (remote flag, `inProd: false`). No dedicated E2E test was added in this PR because:

1. The feature requires LaunchDarkly flag enablement — not available in standard test build
2. Unit tests cover the feature extensively:
   - `close-position-modal.test.tsx`: 771 lines, all close+limit paths tested
   - `close-position-utils.test.ts`: 67 lines, utility function coverage
   - `order-entry-header.test.tsx`: 76 lines
   - `order-type-toggle.test.tsx`: 65 lines
3. The feature flag registry entry (`perpsClosePositionLimitOrderEnabled`) is correctly registered for future E2E use when the flag is enabled

**Recommendation:** Add E2E test coverage for the limit-order close flow in a follow-up once the feature is enabled in test builds.
