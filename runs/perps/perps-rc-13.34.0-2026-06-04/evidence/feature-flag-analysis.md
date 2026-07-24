# Perps Feature Flag Analysis — v13.42.0

**Generated:** 2026-07-24

---

## Feature Flags Introduced in v13.42.0

### `perpsClosePositionLimitOrderEnabled`

| Property | Value |
|---|---|
| **Name** | `perpsClosePositionLimitOrderEnabled` |
| **Type** | Remote (LaunchDarkly) |
| **inProd** | `false` |
| **productionDefault** | `false` |
| **Status** | Active |
| **PR** | [#44466](https://github.com/MetaMask/metamask-extension/pull/44466) |

**Description:** Gates the "Limit" order type option in the close-position modal. When `false` (the default), users see only the existing "Market" close option — no UI change. When `true` (enabled via LaunchDarkly), the modal renders an order-type toggle between Market and Limit, with a limit-price input field.

**Risk Assessment:**
- Flag is `false` by default in production — no user-visible change in the RC build
- Feature does not modify the market-order close path — existing close behavior is unchanged
- UI renders conditionally: `if (closePositionLimitOrderEnabled) { ... }` — dead code when flag is off
- All existing close-position E2E tests (PLC-01 through PLC-05, PLC-08, PLC-09) pass without enabling this flag

**Testing with flag enabled:** Not testable in standard RC test build. Requires LaunchDarkly flag override or test build with `perpsClosePositionLimitOrderEnabled=true`. Covered by unit tests (771 lines).

---

## Existing Perps Feature Flags (Carried from Previous Releases)

| Flag | Type | inProd | Default | Description |
|---|---|---|---|---|
| `perpsEnabled` | Remote | true | false | Master Perps feature gate |
| `perpsBottomNavEnabled` | Remote | false | false | Bottom nav bar A/B experiment (see #44403) |
| `perpsClosePositionLimitOrderEnabled` | Remote | false | false | Limit orders for close position (NEW in v13.42.0) |

---

## Bottom Nav Experiment Flag Impact on Perps

The `perpsBottomNavEnabled` flag (introduced in #44403) affects how users navigate to the Perps screen:

- **When `false` (default):** Standard Perps tab in the Home page subtab bar
- **When `true` (treatment):** Perps is accessed via bottom navigation bar; the Perps subtab is hidden

**Analytics impact:** When treatment is active, `PerpsScreenViewed` events receive `source: "bottom_nav_bar"` instead of `source: "perps_tab"` (implemented in #44611).

**E2E compatibility:** All perps E2E tests use `PerpsTab.navigateToPerpsHome()` which is abstracted to handle both variants. Tests pass in both flag states.

---

## Recommendation

The close-position-with-limit-orders feature should have E2E test coverage added before the flag is enabled in production. Suggested test cases:

1. Close-position modal shows Market/Limit toggle when flag is enabled
2. Selecting Limit shows limit-price input field
3. Entering a valid limit price enables the confirm button
4. Entering an invalid limit price (e.g., 0) disables the confirm button
5. Submitting a limit close order creates an open order (not an immediate fill)

These can be added as a new `perps-close-limit-orders.spec.ts` spec once the flag is enabled in test builds.
