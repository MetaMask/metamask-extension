# Perps E2E Test Coverage Matrix — v13.40.0

Generated: 2026-07-10  
Source: `test/e2e/tests/perps/`

## Summary

| Spec file | Tests | PASS | SKIP | GAP |
|---|---|---|---|---|
| `perps-position-lifecycle.spec.ts` | 11 | 9 | 2 | 0 |
| `perps-tpsl.spec.ts` | 3 | 2 | 0 | 1 |
| `perps-watchlist.spec.ts` | 2 | 2 | 0 | 0 |
| `perps-activity.spec.ts` | 6 | 6 | 0 | 0 |
| `perps-withdraw.spec.ts` | 4 | 4 | 0 | 0 |
| `perps-geo-block.spec.ts` | 2 | 2 | 0 | 0 |
| `perps-home.spec.ts` | 8 | 0 | 8 | 0 |
| **TOTAL** | **36** | **25** | **10** | **1** |

> Note: `perps-home.spec.ts` tests are marked `it.skip` with comment "WebSocket mocks not yet wired for real PerpsStreamManager". These are pre-written test stubs awaiting mock wiring — they do not represent regressions.

## New Features Without E2E Coverage

| Feature | PR | Recommended test file |
|---|---|---|
| Privacy mode hides balance/positions | #44262 | `perps-privacy-mode.spec.ts` (new) |
| TP/SL screen shows entry/current/liq prices | #43884 | Extend `perps-tpsl.spec.ts` |
| Single size input USD/asset toggle | #44035 | Extend `perps-position-lifecycle.spec.ts` |
| Full asset names (`perpsShowFullAssetNames`) | #43979 | Extend `perps-watchlist.spec.ts` or new file |

## Page Object Coverage

| Page Object | File |
|---|---|
| `PerpsTab` | `page-objects/pages/home/perps-tab.ts` |
| `PerpsMarketListPage` | `page-objects/pages/perps/perps-market-list-page.ts` |
| `PerpsMarketDetailPage` | `page-objects/pages/perps/perps-market-detail-page.ts` |
| `PerpsOrderEntryPage` | `page-objects/pages/perps/perps-order-entry-page.ts` |
| `PerpsActivityPage` | `page-objects/pages/perps/perps-activity-page.ts` |
| `PerpsWithdrawPage` | `page-objects/pages/perps/perps-withdraw-page.ts` (withdraw legacy) |
| `PerpsWithdrawConfirmation` | `page-objects/pages/confirmations/perps-withdraw-confirmation.ts` |
| `PerpsPositionsBase` | `page-objects/pages/perps/perps-positions-base.ts` |
