/**
 * Adaptive significant-digit price formatters for Perps.
 *
 * Matches mobile's formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL }).
 * No mobile-specific imports — safe to use in the extension background, UI,
 * and any future consumer.
 *
 * @see docs/perps/perps-rules-decimals.md (canonical spec)
 */

export type PerpsPriceRange = {
  condition: (val: number) => boolean;
  minimumDecimals: number;
  maximumDecimals: number;
  significantDigits: number;
};

/**
 * Universal price ranges for perps asset price formatting.
 * Evaluated top-to-bottom; the first matching range is used.
 *
 * Mirrors mobile's PRICE_RANGES_UNIVERSAL from perpsFormatters.ts exactly.
 */
export const PRICE_RANGES_UNIVERSAL: PerpsPriceRange[] = [
  // > $100,000: no decimals, 6 significant figures
  {
    condition: (v) => Math.abs(v) > 100_000,
    minimumDecimals: 0,
    maximumDecimals: 0,
    significantDigits: 6,
  },
  // $10,000 – $100,000: no decimals, 5 significant figures
  {
    condition: (v) => Math.abs(v) > 10_000,
    minimumDecimals: 0,
    maximumDecimals: 0,
    significantDigits: 5,
  },
  // $1,000 – $10,000: max 1 decimal, 5 significant figures
  {
    condition: (v) => Math.abs(v) > 1_000,
    minimumDecimals: 0,
    maximumDecimals: 1,
    significantDigits: 5,
  },
  // $100 – $1,000: max 2 decimals, 5 significant figures
  {
    condition: (v) => Math.abs(v) > 100,
    minimumDecimals: 0,
    maximumDecimals: 2,
    significantDigits: 5,
  },
  // $10 – $100: max 4 decimals, 5 significant figures
  {
    condition: (v) => Math.abs(v) > 10,
    minimumDecimals: 0,
    maximumDecimals: 4,
    significantDigits: 5,
  },
  // $0.01 – $10: min 2, max 6 decimals, 5 significant figures
  {
    condition: (v) => Math.abs(v) >= 0.01,
    minimumDecimals: 2,
    maximumDecimals: 6,
    significantDigits: 5,
  },
  // < $0.01: min 2, max 6 decimals, 4 significant figures
  {
    condition: () => true,
    minimumDecimals: 2,
    maximumDecimals: 6,
    significantDigits: 4,
  },
];

/**
 * Format a perps asset price using adaptive significant-digit rules.
 *
 * Matches mobile's formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL }).
 * Uses Intl.NumberFormat with style: 'currency' so thousand separators and the
 * $ symbol are added automatically according to the locale.
 *
 * @param value - Numeric price value (e.g. 3245.67890123)
 * @param locale - BCP 47 locale string (e.g. 'en-US'). Defaults to 'en-US'.
 * @param ranges - Optional range config override. Defaults to PRICE_RANGES_UNIVERSAL.
 * @returns Formatted price string (e.g. '$3,245.7', '$0.000123')
 */
const formatterCache = new Map<string, Intl.NumberFormat>();

function getFormatter(
  locale: string,
  minDec: number,
  maxDec: number,
  sigDigits: number,
): Intl.NumberFormat {
  const key = `${locale}:${minDec}:${maxDec}:${sigDigits}`;
  let fmt = formatterCache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: minDec,
      maximumFractionDigits: maxDec,
      minimumSignificantDigits: sigDigits,
      maximumSignificantDigits: sigDigits,
      roundingPriority: 'lessPrecision',
    });
    formatterCache.set(key, fmt);
  }
  return fmt;
}

export function formatPerpsPrice(
  value: number,
  locale = 'en-US',
  ranges: PerpsPriceRange[] = PRICE_RANGES_UNIVERSAL,
): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  const range = ranges.find((r) => r.condition(value));

  if (!range) {
    return getFormatter(locale, 2, 2, 2).format(value);
  }

  return getFormatter(
    locale,
    range.minimumDecimals,
    range.maximumDecimals,
    range.significantDigits,
  ).format(value);
}
