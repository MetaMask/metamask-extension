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
};

/**
 * Derive the USD notional used to resolve an order or close fee quote.
 * TP/SL pairs use their largest trigger price; reverse orders use a multiplier.
 *
 * @param options - USD amount or asset size and price, with optional close percentage and multiplier.
 * @returns Absolute USD notional, with empty inputs treated as zero.
 */
export function getPerpsNotionalUsd(options: PerpsNotionalOptions): number {
  const parse = (value: string | number): number =>
    typeof value === 'number'
      ? value
      : Number.parseFloat(value.replaceAll(',', '')) || 0;
  const notional =
    'usdAmount' in options
      ? Math.abs(parse(options.usdAmount))
      : Math.abs(parse(options.size)) *
        (Array.isArray(options.price)
          ? Math.max(...options.price.map(parse))
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
