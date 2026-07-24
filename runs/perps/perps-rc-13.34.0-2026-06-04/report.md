# Perps RC Headless Automation Report — v13.42.0

**Run ID:** perps-rc-13.34.0-2026-06-04
**Release:** MetaMask Extension v13.42.0
**Test Date:** 2026-07-24 (Friday)
**Automation Mode:** Headless (mock WebSocket + HTTP overrides; no live funds)
**Full Regression:** false (Critical cases only)
**Release PR:** [#44797](https://github.com/MetaMask/metamask-extension/pull/44797)
**Build (Chrome test):** [metamask-chrome-13.42.0.zip](https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/30036971851/build-test-webpack/builds/metamask-chrome-13.42.0.zip)
**CI Run ID:** 30036971851

---

## Executive Summary

| Metric | Value |
|---|---|
| Total active E2E tests | 32 |
| Tests PASSED | 32 |
| Tests SKIPPED (pre-existing) | 12 |
| Tests FAILED | 0 |
| New perps features in this release | 4 |
| Critical blockers found | 0 |
| Pre-existing known issues | 1 (reverse-position — gated by upstream perps-controller fix) |

**Verdict: ✅ GREEN — No perps regressions found in v13.42.0. Safe to release.**

---

## Perps Changes in v13.42.0

The following commits modify Perps functionality since v13.41.0 (cut 2026-07-17):

### New Features

| Commit | PR | Description | Risk |
|---|---|---|---|
| `9962ac769f` | [#44466](https://github.com/MetaMask/metamask-extension/pull/44466) | **feat: implement close positions with limit orders** — Adds order type toggle (Market / Limit) and limit-price input to the close-position modal. Gated behind `perpsClosePositionLimitOrderEnabled` remote feature flag (`inProd: false, productionDefault: false`). | Low (flag-gated) |
| `5207d27d9c` | [#44403](https://github.com/MetaMask/metamask-extension/pull/44403) | **feat: add bottom nav experiment display logic and e2e tests** — Implements bottom nav bar A/B treatment that replaces Perps/Activity subtabs with a persistent bottom nav. Gated by LaunchDarkly experiment. | Low (flag-gated) |
| `6c0217c496` | [#44641](https://github.com/MetaMask/metamask-extension/pull/44641) | **feat: add bottom nav transitions** — Smooth animated transitions for bottom nav navigation including Perps tab. | Low (UI-only) |
| `8f66b8fc55` | [#44611](https://github.com/MetaMask/metamask-extension/pull/44611) | **feat: add bottom nav bar source to perps view events** — Enriches `PerpsScreenViewed` Segment event with `source: "bottom_nav_bar"` when Perps is accessed via the bottom nav bar. Corresponding perps-controller update in [core#9551](https://github.com/MetaMask/core/pull/9551). | Low (metrics-only) |

### Feature Flag Status

The **close positions with limit orders** feature (`perpsClosePositionLimitOrderEnabled`) is registered as a remote feature flag with `inProd: false` and `productionDefault: false`. The feature UI is rendered only when the flag is enabled via LaunchDarkly. Standard production users and the RC build (without flag override) see the existing market-order-only close position flow — no regression risk for standard users.

---

## Test Results by Suite

### Perps Position Lifecycle (`perps-position-lifecycle.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Opens long market order then closes position | ✅ PASS | Full close flow with WS push |
| 2 | Opens short market order then closes position | ✅ PASS | Full close flow with WS push |
| 3 | Partially closes 50% of ETH long from homepage | ✅ PASS | Position size updated to 1.25 ETH |
| 4 | Reduces exposure (partial close) via Modify menu | ✅ PASS | Position size updated to 2.25 ETH |
| 5 | Adds exposure to existing ETH long via Modify menu | ✅ PASS | Position size updated to 2.5667 ETH |
| 6 | Reverses ETH long to short via Modify menu | ⏭ SKIP | Pre-existing: `perps-controller` v4.0.0 `validateOrder()` fails with ORDER_PRICE_REQUIRED |
| 7 | Reverses BTC short to long | ⏭ SKIP | Same upstream blocker as above |
| 8 | Adds margin and verifies liquidation price | ✅ PASS | Liquidation price updated to 2,320 |
| 9 | Removes margin from ETH position | ✅ PASS | Liquidation price updated to 2,480 |
| 10 | Position card visible on Perps home | ✅ PASS | ETH 2.5 ETH position card shown |
| 11 | Clicking position card navigates to market detail | ✅ PASS | ETH market detail loaded |

**Result: 9 PASS, 2 SKIP (pre-existing)**

---

### Perps Activity (`perps-activity.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Filter dropdown shows all four options | ✅ PASS | Trades, Orders, Funding, Deposits all visible |
| 2 | Filters by Trades — shows trade transactions | ✅ PASS | ETH open-long fill visible |
| 3 | Filters by Orders — shows order transactions | ✅ PASS | ETH limit order visible |
| 4 | Filters by Funding — shows funding transactions | ✅ PASS | ETH funding payment visible |
| 5 | Filters by Deposits — shows deposit transactions | ✅ PASS | USDC deposit visible |
| 6 | Clicking order transaction navigates to market detail | ✅ PASS | ETH market detail page loaded |
| 7 | Recent activity section shows trade row on home | ✅ PASS | Non-empty activity section rendered |

**Result: 7 PASS, 0 SKIP**

---

### Perps Withdraw (`perps-withdraw.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Withdraw page loads with header and summary rows | ✅ PASS | Legacy withdraw flow intact |
| 2 | Submits valid withdrawal — shows success toast | ✅ PASS | Toast appears on home after submit |
| 3 | Submit disabled when amount is zero | ✅ PASS | Button disabled by default |
| 4 | Validation error when amount exceeds balance | ✅ PASS | "exceeds" validation message shown |
| 5 | Submits valid withdrawal from confirmation flow | ✅ PASS | $50 withdraw: success toast shown |
| 6 | Blocks withdrawal above Perps available balance | ✅ PASS | Insufficient funds reason displayed |

**Result: 6 PASS, 0 SKIP**

Note: The `f602fae822` refactor migrating the withdraw toast does not break existing withdraw flows. Both the legacy page and the new confirmation flow pass.

---

### Perps Take Profit / Stop Loss (`perps-tpsl.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Sets Take Profit on ETH long and closes position | ✅ PASS | Position closed, activity shows trade |
| 2 | Sets Stop Loss on ETH long and closes position | ✅ PASS | Position closed, activity shows trade |

**Result: 2 PASS, 0 SKIP**

---

### Perps Watchlist (`perps-watchlist.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Adds market to watchlist and verifies on Perps home | ✅ PASS | Star icon fills, market appears in watchlist |
| 2 | Removes market from watchlist | ✅ PASS | Star icon empties, market removed |
| 3 | Watchlist persists across navigation | ✅ PASS | Watchlist state stable |

**Result: 3 PASS, 0 SKIP**

---

### Perps Geo-block (`perps-geo-block.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | Geo-blocked user: Add funds shows modal, Got it dismisses | ✅ PASS | Geo-block modal correctly shown and dismissed |
| 2 | Eligible user can access Long without geo-block modal | ✅ PASS | Long CTA available |

**Result: 2 PASS, 0 SKIP**

---

### WebSocket Connection (`web-socket-connection.spec.ts`)

| # | Test | Result | Notes |
|---|---|---|---|
| 1 | WebSocket connects on Perps home | ✅ PASS | Connection established |
| 2 | Reconnects after disconnect | ✅ PASS | Reconnect UX functional |
| 3 | Order book stream updates ladder | ✅ PASS | Order book ladder renders |

**Result: 3 PASS, 0 SKIP**

---

### Perps Home (`perps-home.spec.ts`)

| # | Test | Result |
|---|---|---|
| All 10 tests | ⏭ SKIP (entire suite) | Pre-existing: stale legacy spec, superseded by perps-tab coverage in other suites |

---

## Risk Assessment

### Close Positions with Limit Orders (#44466)

**Risk: LOW**

- Feature is entirely flag-gated (`perpsClosePositionLimitOrderEnabled`, remote, `inProd: false`)
- Flag defaults to `false` in production — users cannot encounter the new UI unless LaunchDarkly enables it
- Unit test coverage: 771 lines of tests in `close-position-modal.test.tsx`, 67 lines in `close-position-utils.test.ts`
- The existing market-order close flow is unmodified — confirmed by all close-position E2E tests passing

### Bottom Nav Experiment (#44403, #44641, #44611)

**Risk: LOW**

- A/B test behind LaunchDarkly flag — control group sees no change
- Perps accessibility is identical in both control and treatment (`navigateToPerpsHome()` works in both)
- Event analytics enrichment (#44611) is additive only — no functional change
- All E2E tests use `perpsTab.navigateToPerpsHome()` which works regardless of treatment variant

### Known Pre-existing Issues

| Issue | Status | Blocker? |
|---|---|---|
| `perps-controller` v4.0.0: `TradingService.flipPosition()` fails with `ORDER_PRICE_REQUIRED` | Open — requires upstream fix in `@metamask/perps-controller` | No (reverse-position tests skipped; not customer-facing regression) |
| `perps-home.spec.ts` entire suite skipped | Open — stale legacy spec | No |

---

## Evidence

- [`evidence/test-coverage-matrix.md`](./evidence/test-coverage-matrix.md) — Full test case matrix with assertions
- [`evidence/perps-changes-v13.42.0.md`](./evidence/perps-changes-v13.42.0.md) — Code analysis of all perps commits
- [`evidence/feature-flag-analysis.md`](./evidence/feature-flag-analysis.md) — Feature flag registry and risk assessment

---

## Sign-off

| Item | Status |
|---|---|
| No perps regressions found | ✅ |
| All active tests pass | ✅ |
| Pre-existing skips unchanged from v13.41.0 baseline | ✅ |
| New feature (close-with-limit) flag-gated, no production risk | ✅ |
| Bottom nav changes flag-gated, metrics additive only | ✅ |

**Overall: ✅ PERPS SIGN-OFF — v13.42.0 RC approved for release from Perps perspective.**

---

*Generated by Perps RC Headless Automation on 2026-07-24. Report covers Critical cases only (FULL_REGRESSION=false). Tests run in headless mock mode against metamask-chrome-13.42.0.zip (CI run 30036971851).*
