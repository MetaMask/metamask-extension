export const MAX_CLOSE_LIMIT_PRICE_DEVIATION = 0.95;

/**
 * Parses a price and rejects zero, negative, and non-finite values.
 *
 * @param value - A raw numeric or formatted string price.
 * @returns The parsed positive price, or `null` when invalid.
 */
export function parsePositivePrice(
  value: number | string | null | undefined,
): number | null {
  const parsed =
    typeof value === 'string'
      ? Number.parseFloat(value.replaceAll(/[$,]/gu, ''))
      : value;

  return typeof parsed === 'number' &&
    Number.isFinite(parsed) &&
    parsed > 0
    ? parsed
    : null;
}

/**
 * Chooses the live reference used by HyperLiquid's oracle-deviation guard.
 *
 * @param prices - Available live prices in priority order.
 * @param prices.markPrice - Oracle mark price.
 * @param prices.currentPrice - Current market price.
 * @param prices.midPrice - Optional top-of-book midpoint.
 * @returns The first valid reference price, or `null`.
 */
export function getCloseLimitReferencePrice({
  markPrice,
  currentPrice,
  midPrice,
}: {
  markPrice?: number | string;
  currentPrice: number;
  midPrice?: number;
}): number | null {
  return (
    parsePositivePrice(markPrice) ??
    parsePositivePrice(currentPrice) ??
    parsePositivePrice(midPrice)
  );
}

/**
 * Checks HyperLiquid's ratio-based oracle deviation band.
 *
 * The exact boundary remains valid; only values strictly outside are rejected.
 * Invalid prices are rejected so `NaN` cannot bypass final validation.
 *
 * @param limitPrice - Proposed close-limit price.
 * @param referencePrice - Live oracle/current reference price.
 * @param maxDeviation - Maximum ratio deviation.
 * @returns Whether the price is invalid or outside the allowed band.
 */
export function isCloseLimitPriceOutsideDeviation(
  limitPrice: number | string | null | undefined,
  referencePrice: number | string | null | undefined,
  maxDeviation = MAX_CLOSE_LIMIT_PRICE_DEVIATION,
): boolean {
  const parsedLimitPrice = parsePositivePrice(limitPrice);
  const parsedReferencePrice = parsePositivePrice(referencePrice);

  if (
    parsedLimitPrice === null ||
    parsedReferencePrice === null ||
    !Number.isFinite(maxDeviation) ||
    maxDeviation < 0 ||
    maxDeviation >= 1
  ) {
    return true;
  }

  const lowerPrice = Math.min(parsedLimitPrice, parsedReferencePrice);
  const higherPrice = Math.max(parsedLimitPrice, parsedReferencePrice);
  const boundary = (1 - maxDeviation) * higherPrice;
  const floatingPointTolerance = Number.EPSILON * higherPrice * 4;

  return lowerPrice + floatingPointTolerance < boundary;
}
