# Code Analysis Summary — Perps v13.40.0

## Key Risk Areas Reviewed

### 1. Privacy Mode Fix (#44262) — HIGH ATTENTION

**File:** `ui/components/app/perps/**` (multiple)  
**Change:** Wrapped monetary/percentage values in `SensitiveText` driven by `privacyMode` preference  
**Risk:** Low — uses same `SensitiveText` pattern already deployed for wallet balance and DeFi list  
**Gap:** No E2E test. The fix is for regression TAT-3268. Recommend manual verification:
  - Enable global privacy mode (Settings > Security)
  - Navigate to Perps tab
  - Verify balance, P&L, position sizes, margin values are hidden

### 2. Terminal API Integration (#43765) — MEDIUM ATTENTION

**File:** `app/scripts/controllers/perps/`  
**Change:** Terminal API replaces WebSocket as preferred market data source when `perpsTerminalBackendEnabled: true`  
**Risk:** Medium — the E2E fixture disables this flag (`perpsSlippageConfig2: false`) to prevent order submit gating without live order-book data. The Terminal API code path is not exercised in E2E.  
**Note:** Flag is gated, so only users with the flag enabled in production will use the new data source. Existing WS path is the fallback.

### 3. Controller v9.0.0 Upgrade (#43866) — MEDIUM ATTENTION

**Change:** `@metamask/perps-controller` `^8.1.0` → `^9.0.0`  
**Watchlist sync:** Extension registers stub handlers for `AuthenticatedUserStorageService` so watchlist works local-only. This is an intentional deferral — watchlist state is not persisted to user storage until the service is wired.  
**Risk:** Low for trading. Watchlist state is ephemeral across sessions. Users who starred markets in v13.39.x will not see those stars in v13.40.0 (expected behavior until persistence is wired).

### 4. Single Size Input Toggle (#44035)

**Change:** Order entry now has a USD/asset denomination toggle instead of two separate inputs  
**Risk:** Medium — core order-entry UX changed. The position lifecycle E2E tests still pass because `PerpsOrderEntryPage.submitOrder()` uses the dollar-amount path.  
**Gap:** No test verifying the toggle between USD and asset denomination.

### 5. Reverse Position Tests Remain Skipped

Two `it.skip` tests in `perps-position-lifecycle.spec.ts`:
- `reverses an ETH long position to short via Modify menu`
- `reverses a BTC short position to long`

These were skipped due to `ORDER_PRICE_REQUIRED` from `validateOrder()` inside the background service worker. The perps-controller v9.0.0 upgrade did not explicitly fix this — the comment references `flipPosition()` not passing `entryPrice` as `currentPrice`. This remains open.

## Files Changed — Perps-Specific

```
ui/components/app/perps/               (privacy mode, UI updates)
ui/ducks/perps/                        (analytics migration)
ui/helpers/perps/                      (market data utilities)
app/scripts/controllers/perps/         (Terminal API, stream bridge)
app/scripts/messenger-client-init/     (perps controller init / messenger)
test/e2e/tests/perps/                  (test infrastructure)
test/e2e/page-objects/pages/perps/     (page objects)
```
