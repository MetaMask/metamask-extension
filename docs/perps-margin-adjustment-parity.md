# Perps margin adjustment — extension / mobile parity

This document matches the MetaMask **extension** implementation to **mobile** (`usePerpsAdjustMarginData`, `marginUtils`) so both clients show the same **estimated** liquidation price and distance when adding or removing isolated margin.

## Shared inputs (per position + market)

| Concept | Source |
| -------- | ------ |
| Current isolated margin | `position.marginUsed` |
| Position size (absolute) | `abs(parseFloat(position.size))` |
| Side | `parseFloat(position.size) >= 0` → long |
| Anchor liquidation price | `position.liquidationPrice` (provider) |
| Mark / price for distance | `currentPrice` passed into the hook (extension: live chart/market tick on the market detail page — throttle optional) |
| Max leverage for formula | `position.maxLeverage` with fallback `MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage` (50) |

## Amount UX

- **Add**: clamp by `account.availableBalance`.
- **Remove**: cap by `calculateMaxRemovableMargin` (Hyperliquid transfer-margin rule in `ui/hooks/perps/marginUtils.ts`).
- **Slider**: adjustment amount is **floored** to two decimal places on change (`Math.floor(raw * 100) / 100`).

## Core formulas (`ui/hooks/perps/marginUtils.ts`)

- **`newMargin`**: add → `currentMargin + amount`; remove → `max(0, currentMargin - amount)`.
- **`estimateLiquidationPrice`**: anchored to `anchorLiquidationPrice`, with `maintenanceMarginRate = 1 / maxLeverage`, `directionMultiplier` (−1 long, +1 short), `safeDenominator` on `positionSize * (1 - maintenanceMarginRate)`, result `Math.max(0, anchor + adjustment)`. Short-circuits: `newMargin === 0` or `positionSize === 0` → anchor; invalid inputs → anchor.
- **`liquidationDistancePercent(mark, liq)`**: `|mark − liq| / mark × 100`; `0` if `mark === 0` or `liq` null/0.

## UI

- When **adjustment amount > 0**, liquidation **price** and **distance** show **current → estimated** (anchor vs estimate).
- Estimates are **not** a guarantee of post-trade liquidation price; the venue may differ slightly.

## Multi-provider future

Provider-specific factors (e.g. maintenance rules) should stay behind the same helpers (`estimateLiquidationPrice`, caps) so another venue can swap implementations without changing the hook surface.
