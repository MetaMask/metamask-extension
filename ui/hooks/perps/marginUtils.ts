/**
 * Margin adjustment calculation utilities for the edit-margin UI.
 * Kept aligned with MetaMask mobile `marginUtils` / `usePerpsAdjustMarginData`:
 * Hyperliquid transfer-margin rules for removable cap, anchored liquidation estimate
 * using maintenance margin derived from asset max leverage, and distance from mark.
 *
 * HyperLiquid: transfer_margin_required = max(initial_margin_required, 0.1 × total_position_value)
 * See: https://hyperliquid.gitbook.io/hyperliquid-docs/trading/margin-and-pnl
 *
 * Limitation: Post-trade liquidation price may differ slightly from this estimate; the
 * anchor is the venue-reported `liquidationPrice` for the open position.
 */

/**
 * Margin adjustment configuration constants
 * Mirrored from @metamask/perps-controller / mobile
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

/** Parameters for {@link estimateLiquidationPrice} (mobile parity). */
export type EstimateLiquidationPriceParams = {
  /** Venue-reported liquidation price for the position (anchor). */
  anchorLiquidationPrice: number;
  currentMargin: number;
  newMargin: number;
  /** Absolute position size (coins). */
  positionSize: number;
  isLong: boolean;
  /** Asset max leverage from market metadata; drives maintenance margin rate. */
  maxLeverage: number;
};

/**
 * Avoid division by zero in liquidation adjustment denominator.
 *
 * @param value - Divisor value
 * @param epsilon - Minimum absolute magnitude
 * @returns `value` or signed `epsilon` when too close to zero
 */
export function safeDenominator(value: number, epsilon = 1e-12): number {
  if (!Number.isFinite(value)) {
    return epsilon;
  }
  return Math.abs(value) < epsilon ? epsilon : value;
}

/**
 * Maintenance margin rate from asset max leverage: `1 / maxLeverage` (initial margin at max).
 *
 * @param maxLeverage - Market max leverage for the asset
 * @returns Rate in (0, 1], or fallback when invalid
 */
export function maintenanceMarginRateFromMaxLeverage(
  maxLeverage: number,
): number {
  const fallback = 1 / (MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage as number);
  if (!Number.isFinite(maxLeverage) || maxLeverage <= 0) {
    return fallback;
  }
  return 1 / maxLeverage;
}

/**
 * Liquidation distance as % of mark: `|mark − liq| / mark × 100`.
 * Returns 0 when mark is 0 or liq is null/0 (UI fallback per parity spec).
 *
 * @param markPrice - Live mark / current price for the symbol
 * @param liquidationPrice - Liquidation price (anchor or estimate)
 * @returns Distance in percent
 */
export function liquidationDistancePercent(
  markPrice: number,
  liquidationPrice: number | null,
): number {
  if (
    liquidationPrice === null ||
    !Number.isFinite(liquidationPrice) ||
    !Number.isFinite(markPrice) ||
    markPrice === 0 ||
    liquidationPrice === 0
  ) {
    return 0;
  }
  return (Math.abs(markPrice - liquidationPrice) / markPrice) * 100;
}

/**
 * Estimated liquidation price after margin change, anchored to the provider-reported
 * liquidation price and adjusted by margin delta (mobile `estimateLiquidationPrice`).
 *
 * Short-circuit: if `newMargin === 0` or `positionSize === 0`, returns the anchor.
 * Invalid numeric inputs return `anchorLiquidationPrice` (same as mobile guard clauses).
 *
 * @param params - Anchor, margins, size, side, max leverage
 * @returns Estimated price ≥ 0
 */
export function estimateLiquidationPrice(
  params: EstimateLiquidationPriceParams,
): number {
  const {
    anchorLiquidationPrice,
    currentMargin,
    newMargin,
    positionSize,
    isLong,
    maxLeverage,
  } = params;

  if (
    !Number.isFinite(anchorLiquidationPrice) ||
    !Number.isFinite(currentMargin) ||
    !Number.isFinite(newMargin) ||
    !Number.isFinite(positionSize) ||
    !Number.isFinite(maxLeverage)
  ) {
    return anchorLiquidationPrice;
  }

  if (newMargin === 0 || positionSize === 0) {
    return anchorLiquidationPrice;
  }

  const leverage =
    maxLeverage > 0
      ? maxLeverage
      : (MARGIN_ADJUSTMENT_CONFIG.FallbackMaxLeverage as number);
  const maintenanceMarginRate = maintenanceMarginRateFromMaxLeverage(leverage);
  const oneMinusMmr = 1 - maintenanceMarginRate;
  const denom = safeDenominator(positionSize * oneMinusMmr);

  const marginDelta = newMargin - currentMargin;
  const directionMultiplier = isLong ? -1 : 1;
  const adjustment = (marginDelta / denom) * directionMultiplier;
  const estimated = anchorLiquidationPrice + adjustment;
  return Math.max(0, estimated);
}

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
