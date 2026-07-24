# Perps Code Changes — v13.42.0

**Analysis Date:** 2026-07-24
**Comparison Base:** v13.41.0 (2026-07-17)
**Release PR:** https://github.com/MetaMask/metamask-extension/pull/44797

---

## Perps-specific Commits in v13.42.0

### 1. `9962ac769f` — feat: implement close positions with limit orders (#44466)
**Date:** 2026-07-21 | **Author:** Matt D. (geositta)

**Summary:** Adds a "Limit" order type option to the close-position modal, enabling users to close positions at a specific price instead of immediately at market.

**Files changed:**
- `ui/components/app/perps/close-position/close-position-modal.tsx` — +385 lines: new order type toggle, limit price input, conditional fee display
- `ui/components/app/perps/close-position/close-position-modal.test.tsx` — +771 lines: comprehensive unit tests for all close+limit paths
- `ui/components/app/perps/close-position/close-position-utils.ts` — new file: `getClosePositionOrderType()` utility
- `ui/components/app/perps/close-position/close-position-utils.test.ts` — new file: 67 lines utility tests
- `ui/components/app/perps/order-entry/order-entry.tsx` — +69 lines: wires OrderEntryHeader into order entry
- `ui/components/app/perps/order-entry/order-entry-header/` — new component: displays asset symbol, price, and order-type context in header
- `ui/components/app/perps/order-entry/order-type-toggle/` — new component: Market / Limit toggle buttons
- `ui/components/app/perps/cancel-order/cancel-order-modal.tsx` — +36 lines: reuses OrderEntryHeader
- `ui/components/app/perps/utils/orderUtils.ts` — +56 lines: extended order utilities for limit order validation
- `ui/hooks/perps/usePerpsOrderFees.ts` — minor: adapts fee hook to limit order context
- `ui/pages/perps/perps-order-entry-page.tsx` — refactored: adopts OrderEntryHeader component (removes inline header markup)
- `shared/constants/perps-events.ts` — +4 lines: adds event constants for close-with-limit
- `test/e2e/feature-flags/feature-flag-registry.ts` — adds `perpsClosePositionLimitOrderEnabled` flag entry
- `app/_locales/en/messages.json` and `en_GB/messages.json` — +17 locale keys each

**Feature flag:** `perpsClosePositionLimitOrderEnabled`
- Type: Remote (LaunchDarkly)
- `inProd: false`
- `productionDefault: false`
- Status: Active (but off by default)

**Regression risk:** LOW — flag-gated. Existing market-order close flow is unmodified.

---

### 2. `5207d27d9c` — feat: add bottom nav experiment display logic and e2e tests (#44403)
**Date:** 2026-07-21 | **Author:** Amélie (amelie.chan)

**Summary:** Implements an A/B test bottom navigation bar that replaces the Perps and Activity subtabs on the Home page. When enabled via LaunchDarkly, users see a persistent bottom nav with Home, Swaps, Activity, and Perps buttons.

**Files changed (perps-relevant):**
- `ui/hooks/useBottomNavBar.ts` — new hook: gates bottom nav on route and LD treatment
- `ui/components/app/account-overview/account-overview-tabs.tsx` — hides Perps/Activity subtabs when bottom nav is active; fixes `perpsIsEffectiveActiveTab` badge logic
- E2E page object and spec for bottom nav (non-perps E2E directory)

**Perps impact:** When bottom nav treatment is active, `navigateToPerpsHome()` uses the bottom nav Perps button instead of the tab. All existing perps E2E tests use `PerpsTab.navigateToPerpsHome()` which handles both variants transparently.

**Regression risk:** LOW — A/B gated. Control group (default) sees no change.

---

### 3. `6c0217c496` — feat: add bottom nav transitions (#44641)
**Date:** 2026-07-22 | **Author:** Amélie (amelie.chan)

**Summary:** Adds smooth CSS transitions between bottom nav routes, including transitions into/out of the Perps page.

**Perps impact:** Visual/animation only. No functional change to Perps logic.

**Regression risk:** MINIMAL — CSS transitions only, no state or logic changes.

---

### 4. `8f66b8fc55` — feat: add bottom nav bar source to perps view events (#44611)
**Date:** 2026-07-21 | **Author:** Amélie (amelie.chan)

**Summary:** Enriches the `PerpsScreenViewed` Segment analytics event with a `source: "bottom_nav_bar"` property when the user navigates to Perps via the bottom nav bar. Previously the source was always `"perps_tab"`.

**Files changed:**
- `app/scripts/controllers/perps/PerpsController.ts` — adds `bottom_nav_bar` to `PerpsScreenViewedSource` enum
- `ui/pages/perps/perps-home-page.tsx` — reads `source` from router state and passes to controller event
- Corresponding perps-controller update: [core#9551](https://github.com/MetaMask/core/pull/9551)

**Perps impact:** Analytics/metrics only. No functional change to UI or trading logic.

**Regression risk:** MINIMAL — additive event property.

---

## Commits Included from Previous Cycle (v13.41.0)

These commits were already merged before v13.41.0 was cut (July 14–15) and are included in v13.42.0's release branch. They were validated in the v13.41.0 RC cycle:

| Commit | Description | Status |
|---|---|---|
| `c255a1a983` | feat(perps): show ticker next to volume and fix symbol display consistency | Validated in v13.41.0 |
| `f602fae822` | refactor: migrate perps withdraw transaction toast | Validated in v13.41.0 |
| `baab980461` | fix: resolve Perps deposit confirmation stuck on loading skeleton | Validated in v13.41.0 |
| `25d7175ff4` | chore: nav to perps funding screen on perps funded activity details | Validated in v13.41.0 |
| `7657dcc0da` | fix: render in flight perps deposit/withdraw activity details | Validated in v13.41.0 |
| `eb3b6f521a` | fix(perps): mask open order size and value in privacy mode | Validated in v13.41.0 |
| `a396544397` | chore: use candlestick filled icon when perps bottom nav active | Validated in v13.41.0 |

---

## Dependency Changes Relevant to Perps

No `@metamask/perps-controller` version bump is included in v13.42.0 beyond what was in v13.41.0. The close-position limit order feature uses the existing controller API with client-side flag gating.
