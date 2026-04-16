/**
 * Margin adjustment calculation utilities for the edit-margin UI.
 * Mirrors the logic from @metamask/perps-controller (not exported from package).
 *
 * HyperLiquid: transfer_margin_required = max(initial_margin_required, 0.1 × total_position_value)
 * See: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-and-pnl
 */

/**
 * Margin adjustment configuration constants
 * Mirrored from @metamask/perps-controller
 */
export const MARGIN_ADJUSTMENT_CONFIG = {
  LiquidationRiskThreshold: 1.2, // 20% buffer before liquidation - triggers danger state
  LiquidationWarningThreshold: 1.5, // 50% buffer before liquidation - triggers warning state
  MarginRemovalSafetyBuffer: 0.1, // 10% safety buffer for margin removal
  MinAdjustmentAmount: 1, // Minimum margin adjustment amount in USD
  FallbackMaxLeverage: 50, // Fallback max leverage when market data is unavailable
} as const;

export type RiskLevel = 'safe' | 'warning' | 'danger';

export type MarginRiskAssessment = {
  riskLevel: RiskLevel;
  priceDiff: number;
  riskRatio: number;
};

export type AssessMarginRemovalRiskParams = {
  newLiquidationPrice: number;
  currentPrice: number;
  isLong: boolean;
};

export type CalculateMaxRemovableMarginParams = {
  currentMargin: number;
  positionSize: number;
  entryPrice: number;
  currentPrice: number;
  positionLeverage: number;
  notionalValue?: number;
};

export type CalculateNewLiquidationPriceParams = {
  newMargin: number;
  positionSize: number;
  entryPrice: number;
  isLong: boolean;
  currentLiquidationPrice: number;
};

/**
 * Assess liquidation risk after margin removal.
 *
 * @param params - The parameters for assessing margin removal risk
 * @returns The risk assessment containing risk level, price diff, and risk ratio
 */
export function assessMarginRemovalRisk(
  params: AssessMarginRemovalRiskParams,
): MarginRiskAssessment {
  const { newLiquidationPrice, currentPrice, isLong } = params;
  if (
    !newLiquidationPrice ||
    !currentPrice ||
    Number.isNaN(newLiquidationPrice) ||
    Number.isNaN(currentPrice)
  ) {
    return { riskLevel: 'safe', priceDiff: 0, riskRatio: 0 };
  }
  const priceDiff = isLong
    ? currentPrice - newLiquidationPrice
    : newLiquidationPrice - currentPrice;
  const riskRatio = priceDiff / newLiquidationPrice;
  let riskLevel: RiskLevel;
  if (
    riskRatio <
    (MARGIN_ADJUSTMENT_CONFIG.LiquidationRiskThreshold as number) - 1
  ) {
    riskLevel = 'danger';
  } else if (
    riskRatio <
    (MARGIN_ADJUSTMENT_CONFIG.LiquidationWarningThreshold as number) - 1
  ) {
    riskLevel = 'warning';
  } else {
    riskLevel = 'safe';
  }
  return { riskLevel, priceDiff, riskRatio };
}

/**
 * Calculate maximum margin that can be safely removed from a position.
 *
 * @param params - The parameters for calculating max removable margin
 * @returns The maximum amount of margin that can be safely removed
 */
export function calculateMaxRemovableMargin(
  params: CalculateMaxRemovableMarginParams,
): number {
  const {
    currentMargin,
    positionSize,
    currentPrice,
    positionLeverage,
    notionalValue: providedNotionalValue,
  } = params;

  if (
    Number.isNaN(currentMargin) ||
    Number.isNaN(positionLeverage) ||
    currentMargin <= 0 ||
    positionLeverage <= 0
  ) {
    return 0;
  }

  let notionalValue = providedNotionalValue;
  if (
    notionalValue === undefined ||
    Number.isNaN(notionalValue) ||
    notionalValue <= 0
  ) {
    if (
      Number.isNaN(positionSize) ||
      Number.isNaN(currentPrice) ||
      positionSize <= 0 ||
      currentPrice <= 0
    ) {
      return 0;
    }
    notionalValue = positionSize * currentPrice;
  }

  const initialMarginRequired = notionalValue / positionLeverage;
  const tenPercentMargin =
    notionalValue *
    (MARGIN_ADJUSTMENT_CONFIG.MarginRemovalSafetyBuffer as number);
  const transferMarginRequired = Math.max(
    initialMarginRequired,
    tenPercentMargin,
  );
  return Math.max(0, currentMargin - transferMarginRequired);
}

/**
 * Calculate new liquidation price after margin adjustment.
 *
 * @param params - The parameters for calculating new liquidation price
 * @returns The new liquidation price after the margin adjustment
 */
export function calculateNewLiquidationPrice(
  params: CalculateNewLiquidationPriceParams,
): number {
  const {
    newMargin,
    positionSize,
    entryPrice,
    isLong,
    currentLiquidationPrice,
  } = params;

  if (
    Number.isNaN(newMargin) ||
    Number.isNaN(positionSize) ||
    Number.isNaN(entryPrice) ||
    newMargin <= 0 ||
    positionSize <= 0 ||
    entryPrice <= 0
  ) {
    return currentLiquidationPrice;
  }

  const marginPerUnit = newMargin / positionSize;
  if (isLong) {
    return Math.max(0, entryPrice - marginPerUnit);
  }
  return entryPrice + marginPerUnit;
}
