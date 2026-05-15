import {
  formatPerpsFiat,
  PRICE_RANGES_MINIMAL_VIEW,
  PRICE_RANGES_UNIVERSAL,
} from '../../../../../shared/lib/perps-formatters';

export const PERPS_LIQUIDATION_PRICE_FALLBACK = '--';

export function parsePerpsDisplayPrice(
  value: string | number | null | undefined,
): number {
  return Number.parseFloat(String(value ?? '').replace(/[$,]/gu, ''));
}

export function isPerpsLiquidationPriceValid(
  value: string | number | null | undefined,
): boolean {
  const price = parsePerpsDisplayPrice(value);
  return Number.isFinite(price) && price > 0;
}

export function normalizePerpsDisplayPrice(value: string | number): number {
  return typeof value === 'number' ? value : parsePerpsDisplayPrice(value);
}

export function formatPerpsFiatMinimal(value: string | number): string {
  return formatPerpsFiat(normalizePerpsDisplayPrice(value), {
    ranges: PRICE_RANGES_MINIMAL_VIEW,
  });
}

export function formatPerpsFiatUniversal(value: string | number): string {
  return formatPerpsFiat(normalizePerpsDisplayPrice(value), {
    ranges: PRICE_RANGES_UNIVERSAL,
  });
}

export function formatPerpsLiquidationPrice(
  value: string | number | null | undefined,
): string {
  return isPerpsLiquidationPriceValid(value)
    ? formatPerpsFiatUniversal(value as string | number)
    : PERPS_LIQUIDATION_PRICE_FALLBACK;
}

/**
 * Compute the absolute distance between the current price and the
 * liquidation price as a percentage of the current price. Matches mobile
 * (`Math.abs(currentPrice - liquidationPrice) / currentPrice * 100`) so
 * crossed/already-liquidated edges never render negative percentages.
 * Returns null when either input is unusable.
 *
 * @param currentPrice - Live mark / market price.
 * @param liquidationPrice - Position liquidation price (raw or parsed).
 */
export function getLiquidationDistancePercent(
  currentPrice: number | null | undefined,
  liquidationPrice: string | number | null | undefined,
): number | null {
  if (
    typeof currentPrice !== 'number' ||
    !Number.isFinite(currentPrice) ||
    currentPrice <= 0
  ) {
    return null;
  }
  if (!isPerpsLiquidationPriceValid(liquidationPrice)) {
    return null;
  }
  const liq = parsePerpsDisplayPrice(liquidationPrice as string | number);
  return (Math.abs(currentPrice - liq) / currentPrice) * 100;
}

/**
 * Format a liquidation distance percentage for display.
 *
 * @param percent - Numeric distance percentage.
 */
export function formatLiquidationDistancePercent(percent: number): string {
  return `${Math.round(percent)}%`;
}
