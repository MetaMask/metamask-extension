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
  leverage: 1,
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
 * Preset percentage buttons for balance slider
 */
export const BALANCE_PERCENT_PRESETS = [0, 25, 50, 75, 100] as const;

/**
 * Leverage slider step markers
 */
export const LEVERAGE_PRESETS = [1, 5, 10, 25, 50] as const;

/**
 * Calculate position size from USD amount and price
 * @param usdAmount - Amount in USD
 * @param assetPrice - Current asset price
 * @returns Position size in asset units
 */
export function calculatePositionSize(
  usdAmount: number,
  assetPrice: number,
): number {
  if (assetPrice === 0) {
    return 0;
  }
  return usdAmount / assetPrice;
}

/**
 * Calculate margin required for a position
 * @param usdAmount - Amount in USD
 * @param leverage - Leverage multiplier
 * @returns Margin required in USD
 */
export function calculateMarginRequired(
  usdAmount: number,
  leverage: number,
): number {
  if (leverage === 0) {
    return 0;
  }
  return usdAmount / leverage;
}

/**
 * Calculate maximum possible order amount
 * @param availableBalance - Available balance in USD
 * @param leverage - Leverage multiplier
 * @returns Maximum order amount in USD
 */
export function calculateMaxAmount(
  availableBalance: number,
  leverage: number,
): number {
  return availableBalance * leverage;
}

/**
 * Estimate liquidation price for a position
 * This is a simplified calculation for mock purposes
 * @param entryPrice - Entry price
 * @param leverage - Leverage multiplier
 * @param isLong - Whether position is long
 * @returns Estimated liquidation price
 */
export function estimateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  isLong: boolean,
): number {
  // Simplified: liquidation occurs at ~(1/leverage) move against position
  const liquidationMove = entryPrice / leverage;
  if (isLong) {
    return entryPrice - liquidationMove * 0.9; // 90% of theoretical for safety margin
  }
  return entryPrice + liquidationMove * 0.9;
}
