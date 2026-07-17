# Perps v13.41.0 — Code Changes Audit

**Date**: 2026-07-17  
**Release**: v13.41.0  
**Build**: https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/29529958972/build-test-webpack/builds/metamask-chrome-13.41.0.zip

---

## Perps-Related PRs Merged into v13.41.0

### 1. `feat(perps): show ticker next to volume and fix symbol display consistency` — #44478

**Risk**: Low  
**Type**: Bug fix + display enhancement  
**Changed files**: 27 files

**Summary**:
- Consolidated two near-duplicate helpers (`getDisplayName`, `getDisplaySymbol`) into a single canonical `getDisplaySymbol` in `ui/components/app/perps/utils.ts`
- Fixed reverse-position modal showing raw provider-prefixed symbol (e.g. `xyz:TSLA` → `TSLA`) for HIP-3 markets
- Added ticker suffix to market list volume row (e.g. `BTC · $1.2B Vol`), suppressed when ticker duplicates the name
- Deleted old `perps-market-card/` component (165 lines), replaced with extracted `market-row/` component (239 lines)
- Updated 15 call sites across order-card, position-card, close/cancel/edit-margin modals, watchlist, and market detail/order entry pages

**Risk assessment**: All call sites audited; unit tests updated in `utils.test.ts`, `market-row.test.tsx`, `perps-watchlist.test.tsx`, `reverse-position-modal.test.tsx`. No transaction-submission code touched.

---

### 2. `fix: render in flight perps deposit/withdraw activity details` — #44425

**Risk**: Very Low  
**Type**: Bug fix (UI rendering)  
**Changed files**: ~3 files (PerpsDepositDetails component)

**Summary**:
- `PerpsDepositDetails` previously returned `null` when `useTransactionMeta` had no entry (in-flight/pending state)
- Fix: always renders status, date, and fee rows from `item` and optional `metamaskPay` data
- Hero amount gated on fiat formatting availability; Fund again CTA gated on `transactionMeta` + confirmed status
- No auth, data submission, or transaction logic changed

---

### 3. `chore: nav to perps funding screen on perps funded activity details` — #44427

**Risk**: Low  
**Type**: Navigation improvement  
**Changed files**: ~2 files

**Summary**:
- 'Fund again' CTA in the Perps Funded activity details now navigates directly to the Perps deposit screen instead of going through generic deposit flow
- UX improvement; no financial logic changed

---

### 4. `fix: mask open order size and value in privacy mode` — #44432

**Risk**: Low  
**Type**: Privacy/UX fix  
**Changed files**: `order-card.tsx`, `position-card.tsx`

**Summary**:
- Open order size and notional value fields were not masked when Privacy Mode was enabled
- Fix applies existing privacy masking pattern already used throughout the app
- No functional trading logic changed

---

### 5. `fix: resolve Perps deposit confirmation stuck on loading skeleton on first open` — #44247

**Risk**: Medium (first-open UX)  
**Type**: Bug fix  
**Changed files**: Deposit confirmation component, PerpsController state initialization

**Summary**:
- On first open, the deposit confirmation screen could get stuck on a loading skeleton
- Root cause: race condition in PerpsController state initialization before user subscription WS data arrived
- Fix ensures the deposit screen renders without requiring pre-loaded WS subscription state

---

### 6. `fix: crash when typing a comma in the MM Pay custom amount input` — #44521

**Risk**: Low (input validation)  
**Type**: Bug fix  
**Changed files**: Amount input component shared across Perps withdraw and mUSD conversion

**Summary**:
- Typing a comma (`,`) as a decimal separator in the MetaMask Pay amount field caused a crash
- Affects Perps withdraw and mUSD conversion confirmation flows
- Fix adds sanitization/guard in the amount parsing utility; does not change any financial calculation

---

### 7. `Added order summary tooltips for Margin, Liquidation price, and Fees labels` — #44290

**Risk**: Very Low  
**Type**: UI enhancement  
**Changed files**: Order summary component(s)

**Summary**:
- Added informational tooltips to Margin, Liquidation price, and Fees labels in the order summary section
- Display-only change; no interaction with trading logic or state

---

## Infrastructure / Build Verification

| Check | Status |
|-------|--------|
| CI run `29529958972` on `release/13.41.0` | SUCCESS (38m33s) |
| All unit tests | PASS |
| LavaMoat webpack MV3 policy | PASS |
| LavaMoat webapp policy | PASS |
| LavaMoat webpack MV2 policy | PASS |
| Integration tests | PASS |
| Lint | PASS |
| Storybook build | PASS |
| Chrome test build available | YES — https://diuv6g5fj9pvx.cloudfront.net/metamask-extension/29529958972/build-test-webpack/builds/metamask-chrome-13.41.0.zip |

---

## Known Upstream Blocker

**`@metamask/perps-controller` v4.0.0 — reverse-position validation failure**

Two E2E tests (`reverses an ETH long position to short`, `reverses a BTC short position to long`) are skipped in `perps-position-lifecycle.spec.ts`. The skip comment reads:

> "Broken by @metamask/perps-controller v4.0.0 (commit 447247748c). TradingService.flipPosition() no longer passes entryPrice as currentPrice, so validateOrder() fails with ORDER_PRICE_REQUIRED inside the background service worker. Requires an upstream fix in @metamask/perps-controller to resolve."

This does not represent a regression in v13.41.0 — the skip was already present. The reverse-position UI renders correctly (the modal loads and summary rows are visible per the test at line 399–431); only the final order submission step fails upstream.
