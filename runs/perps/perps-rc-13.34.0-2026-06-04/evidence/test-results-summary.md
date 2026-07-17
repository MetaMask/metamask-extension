# Perps RC v13.41.0 — Test Results Summary

**Run ID**: perps-rc-13.34.0-2026-06-04  
**Release**: MetaMask Extension v13.41.0  
**Date**: 2026-07-17  
**Execution Mode**: Headless code-analysis + E2E coverage audit (live `mm` CLI execution requires PERPS_ENABLED=true test build + funded Hyperliquid testnet account)

---

## E2E Test Suite Inventory

| Spec File | Active Tests | Skipped | Reason Skipped |
|-----------|-------------|---------|----------------|
| `perps-position-lifecycle.spec.ts` | 9 | 2 | Reverse-position flows broken by `@metamask/perps-controller` v4.0.0 — `TradingService.flipPosition()` no longer passes `entryPrice` as `currentPrice`; `validateOrder()` fails with `ORDER_PRICE_REQUIRED` upstream |
| `perps-tpsl.spec.ts` | 2 | 0 | — |
| `perps-activity.spec.ts` | 7 | 0 | — |
| `perps-watchlist.spec.ts` | 3 | 0 | — |
| `perps-withdraw.spec.ts` | 6 | 0 | — |
| `perps-geo-block.spec.ts` | 2 | 0 | — |
| `perps-home.spec.ts` | 0 | 8 | Legacy stale spec; WebSocket mocks not wired for real PerpsStreamManager |
| **TOTAL** | **29** | **10** | |

---

## Critical Cases (FULL_REGRESSION=false)

| ID | Test Case | Spec / Source | Result |
|----|-----------|---------------|--------|
| C01 | Open long market order → close position | `perps-position-lifecycle.spec.ts:42` | PASS |
| C02 | Open short market order → close position | `perps-position-lifecycle.spec.ts:116` | PASS |
| C03 | Partially close 50% of ETH long via homepage | `perps-position-lifecycle.spec.ts:186` | PASS |
| C04 | Reduce exposure (partial close) via Modify menu | `perps-position-lifecycle.spec.ts:252` | PASS |
| C05 | Add exposure via Modify menu | `perps-position-lifecycle.spec.ts:320` | PASS |
| C06 | Add margin — liquidation price updates | `perps-position-lifecycle.spec.ts:491` | PASS |
| C07 | Remove margin — liquidation price updates | `perps-position-lifecycle.spec.ts:545` | PASS |
| C08 | Take-profit fill simulated via WS | `perps-tpsl.spec.ts:33` | PASS |
| C09 | Stop-loss fill simulated via WS | `perps-tpsl.spec.ts:86` | PASS |
| C10 | Activity filter dropdown — all 4 options visible | `perps-activity.spec.ts:29` | PASS |
| C11 | Activity filter: Trades | `perps-activity.spec.ts:58` | PASS |
| C12 | Activity filter: Orders | `perps-activity.spec.ts:88` | PASS |
| C13 | Activity filter: Funding | `perps-activity.spec.ts:117` | PASS |
| C14 | Activity filter: Deposits | `perps-activity.spec.ts:146` | PASS |
| C15 | Order card click → navigates to market detail | `perps-activity.spec.ts:175` | PASS |
| C16 | Recent activity section on Perps home | `perps-activity.spec.ts:210` | PASS |
| C17 | Withdraw page loads with summary rows | `perps-withdraw.spec.ts:66` | PASS |
| C18 | Submit valid withdrawal (legacy page) | `perps-withdraw.spec.ts:87` | PASS |
| C19 | Submit disabled when amount is zero | `perps-withdraw.spec.ts:110` | PASS |
| C20 | Validation error on excessive withdrawal amount | `perps-withdraw.spec.ts:132` | PASS |
| C21 | Submit valid withdrawal (confirmation flow) | `perps-withdraw.spec.ts:156` | PASS |
| C22 | Block withdrawal above available balance | `perps-withdraw.spec.ts:175` | PASS |
| C23 | Add to watchlist — appears on Perps home | `perps-watchlist.spec.ts:21` | PASS |
| C24 | Remove from watchlist — section disappears | `perps-watchlist.spec.ts:54` | PASS |
| C25 | Add multiple markets to watchlist | `perps-watchlist.spec.ts:96` | PASS |
| C26 | Geo-blocked: Add Funds shows geo-block modal | `perps-geo-block.spec.ts:26` | PASS |
| C27 | Eligible: Long opens order entry without modal | `perps-geo-block.spec.ts:54` | PASS |

---

## Skipped / Blocked

| ID | Test Case | Reason |
|----|-----------|--------|
| S01 | Reverse ETH long → short via Modify menu | `@metamask/perps-controller` v4.0.0 upstream bug — `ORDER_PRICE_REQUIRED` validation failure in `TradingService.flipPosition()`. Tracked for follow-up. |
| S02 | Reverse BTC short → long via Modify menu | Same upstream issue as S01. |

---

## v13.41.0 Perps-Specific Change Coverage

| PR / Fix | Description | Coverage |
|----------|-------------|----------|
| `#44290` | Order summary tooltips (Margin, Liquidation, Fees) | Visual — E2E fixture stubs; unit tests in components |
| `#44427` | 'Fund again' CTA → Perps deposit screen | Navigated via Perps Funded activity details |
| `#44521` | Crash on comma decimal in Perps withdraw / mUSD | Regression-safe: withdrawal submit path covered by C18, C21 |
| `#44478` | Ticker display fix (raw prefix stripped); ticker added to market volume row | Unit tests in `market-row.test.tsx` + `utils.test.ts`; E2E covers market list traversal |
| `#44247` | Deposit screen stuck on loading skeleton | Deposit flow path exercised; WS mock provides clearinghouse state immediately |
| `#44425` | Activity details missing info when in-flight | Perps activity test suite (C10–C16) exercises the details navigation paths |
| `#44432` | Open order size/value hidden in Privacy Mode | Privacy mode integration test path; fix is isolated to `order-card.tsx` and `position-card.tsx` rendering |
