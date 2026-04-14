/**
 * Mock data for OrderEntry component development
 * Used for building UI while PerpsController integration is pending
 */

import type { OrderFormState } from './order-entry.types';

/**
 * Default form state for a new order
 */
export const mockOrderFormDefaults: OrderFormState = {
  asset: 'BTC',
  direction: 'long',
  amount: '',
  leverage: 3,
  balancePercent: 0,
  takeProfitPrice: '',
  stopLossPrice: '',
  limitPrice: '',
  type: 'market',
  autoCloseEnabled: false,
};

/**
 * Mock price data for supported assets
 */
export const mockPriceData: Record<string, number> = {
  BTC: 45250.0,
  ETH: 3025.5,
  SOL: 97.25,
  ARB: 1.15,
  POL: 0.77,
};

/**
 * Mock max leverage by asset
 */
export const mockMaxLeverage: Record<string, number> = {
  BTC: 50,
  ETH: 50,
  SOL: 20,
  ARB: 25,
  POL: 20,
};

/**
 * Mock available balance for testing
 */
export const mockAvailableBalance = 10125.0;

/**
 * Calculate position size from USD amount and price, rounded to asset size decimals.
 *
 * Mirrors HyperLiquid's server-side rounding: orders are quantised to `szDecimals`
 * decimal places, so the effective notional (positionSize × price) can differ
 * slightly from the user-entered USD amount. This rounding must be applied before
 * computing margin to match the values shown on mobile.
 *
 * When `szDecimals` is not provided (market info not yet loaded) the raw unrounded
 * division is returned as a safe fallback.
 *
 * @param usdAmount - Amount in USD
 * @param assetPrice - Current asset price
 * @param szDecimals - HyperLiquid size decimals for the asset (optional; omit to skip rounding)
 * @returns Position size in asset units, rounded to szDecimals when provided
 */
export function calculatePositionSize(
  usdAmount: number,
  assetPrice: number,
  szDecimals?: number,
): number {
  if (assetPrice === 0) {
    return 0;
  }
  const raw = usdAmount / assetPrice;
  if (szDecimals === undefined) {
    return raw;
  }
  const factor = Math.pow(10, szDecimals);
  return Math.trunc(raw * factor) / factor;
}
