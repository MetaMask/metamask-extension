/** Basis-point denominator: 10000 bips = 100%. */
export const BASIS_POINTS_DIVISOR = 10000;

type PerpsNotionalOptions = (
  | { usdAmount: string | number }
  | {
      size: string | number;
      price: string | number | [string | number, string | number];
    }
) & {
  closePercent?: number;
  multiplier?: number;
  /** Allow empty editable amount/price fields, but never an empty asset size. */
  allowEmpty?: boolean;
};

/**
 * Derive the USD notional used to resolve an order or close fee quote.
 * TP/SL pairs use their largest trigger price; reverse orders use a multiplier.
 *
 * @param options - USD amount or asset size and price, with optional close percentage and multiplier.
 * @returns Absolute USD notional, with empty editable amount/price fields treated as zero unless allowEmpty is false.
 * @throws RangeError when a required input is empty, malformed or nonfinite.
 */
export function getPerpsNotionalUsd(options: PerpsNotionalOptions): number {
  const parse = (
    value: string | number,
    allowEmpty = options.allowEmpty ?? true,
  ): number => {
    const normalized =
      typeof value === 'string' ? value.replaceAll(',', '').trim() : value;
    // A decimal point alone is an unfinished editable amount, not a live size.
    if ((normalized === '' || normalized === '.') && allowEmpty) {
      return 0;
    }
    const parsed = normalized === '' ? NaN : Number(normalized);
    if (!Number.isFinite(parsed)) {
      throw new RangeError('Invalid Perps notional input');
    }
    return parsed;
  };
  const notional =
    'usdAmount' in options
      ? Math.abs(parse(options.usdAmount))
      : Math.abs(parse(options.size, false)) *
        (Array.isArray(options.price)
          ? Math.max(...options.price.map((price) => parse(price)))
          : parse(options.price));
  return (
    notional * ((options.closePercent ?? 100) / 100) * (options.multiplier ?? 1)
  );
}

/**
 * Apply a rewards discount only to a locally estimated MetaMask fee.
 * Resolved controller fees must bypass this function.
 *
 * @param value - Local fallback rate or amount.
 * @param discountBips - Rewards discount in basis points.
 * @returns Discounted fallback, or the original value when no discount is available.
 */
export function applyPerpsFallbackDiscount(
  value: number,
  discountBips?: number,
): number {
  return discountBips === undefined || discountBips <= 0
    ? value
    : value * (1 - discountBips / BASIS_POINTS_DIVISOR);
}
