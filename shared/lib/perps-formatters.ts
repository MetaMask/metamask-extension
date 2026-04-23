/**
 * Portable perps decimal formatters and order calculation helpers.
 *
 * TEMPORARY LOCAL COPY — TAT-2990.
 * These helpers duplicate exports from `@metamask/perps-controller` so extension
 * UI never pulls runtime values out of the controller package. The controller's
 * main entry transitively loads ESM-only deps (`@noble/hashes@2` via
 * `@nktkas/hyperliquid`) that break Jest's default transformIgnorePatterns and
 * force LavaMoat policy churn. Once TAT-2990 lands (HyperLiquid SDK lazy-load
 * in the controller so the main entry is CJS-safe), delete this file and
 * re-import directly from `@metamask/perps-controller`.
 *
 * Sources of truth:
 * - metamask-mobile/app/controllers/perps/utils/perpsFormatters.ts
 * - metamask-mobile/app/controllers/perps/utils/orderCalculations.ts
 *
 * Intl.NumberFormat instances are cached in a module-level Map keyed by
 * serialized options, avoiding repeated construction costs.
 *
 * @see docs/perps/perps-rules-decimals.md (canonical spec)
 */

// ---------------------------------------------------------------------------
// Inlined mobile constants (kept in lock-step with
// metamask-mobile/app/controllers/perps/constants/perpsConfig.ts).
// If mobile's values change, update here too.
// ---------------------------------------------------------------------------

const DECIMAL_PRECISION_CONFIG = {
  /** Maximum decimal places for price input (matches Hyperliquid limit). */
  MaxPriceDecimals: 6,
} as const;

const FUNDING_RATE_CONFIG = {
  /** Multiplier to convert decimal funding rate to percentage. */
  PercentageMultiplier: 100,
  /** Number of decimal places to display for funding rates. */
  Decimals: 4,
  /** Default display value when funding rate is zero or unavailable. */
  ZeroDisplay: '0.0000%',
} as const;

const PERPS_CONSTANTS = {
  /** Display when price data is unavailable. */
  FallbackPriceDisplay: '$---',
  /** Display for zero dollar amounts with decimals. */
  ZeroAmountDetailedDisplay: '$0.00',
} as const;

// ---------------------------------------------------------------------------
// Module-level Intl.NumberFormat cache (keyed by serialized options).
// ---------------------------------------------------------------------------

const _fmtCache = new Map<string, Intl.NumberFormat>();

function _formatCurrency(
  value: number,
  currency: string,
  opts: { minimumFractionDigits: number; maximumFractionDigits: number },
): string {
  const key = `${currency}:${opts.minimumFractionDigits}:${opts.maximumFractionDigits}`;
  let formatter = _fmtCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: opts.minimumFractionDigits,
      maximumFractionDigits: opts.maximumFractionDigits,
    });
    _fmtCache.set(key, formatter);
  }
  return formatter.format(value);
}

/**
 * Internal equivalent of the mobile formatWithThreshold utility.
 * Formats a currency value, returning "<$X.XX" for values below threshold.
 *
 * @param amount - The numeric amount to format.
 * @param threshold - The threshold below which the "<" prefix is shown.
 * @param options - Intl formatting options.
 * @param options.currency - ISO 4217 currency code.
 * @param options.minimumFractionDigits - Minimum decimal digits.
 * @param options.maximumFractionDigits - Maximum decimal digits.
 * @returns Formatted currency string.
 */
function _formatWithThreshold(
  amount: number,
  threshold: number,
  options: {
    currency: string;
    minimumFractionDigits: number;
    maximumFractionDigits: number;
  },
): string {
  const formatOpts = {
    minimumFractionDigits: options.minimumFractionDigits,
    maximumFractionDigits: options.maximumFractionDigits,
    currencyDisplay: 'narrowSymbol' as const,
  };
  if (amount === 0) {
    return _formatCurrency(0, options.currency, formatOpts);
  }
  return Math.abs(amount) < threshold
    ? `<${_formatCurrency(threshold, options.currency, formatOpts)}`
    : _formatCurrency(amount, options.currency, formatOpts);
}

/**
 * Price threshold constants for PRICE_RANGES_UNIVERSAL.
 * These define the boundaries between different formatting ranges.
 */
export const PRICE_THRESHOLD = {
  /** Very high values boundary (> $100k). */
  VERY_HIGH: 100_000,
  /** High values boundary (> $10k). */
  HIGH: 10_000,
  /** Large values boundary (> $1k). */
  LARGE: 1_000,
  /** Medium values boundary (> $100). */
  MEDIUM: 100,
  /** Medium-low values boundary (> $10). */
  MEDIUM_LOW: 10,
  /** Low values boundary (>= $0.01). */
  LOW: 0.01,
  /**
   * Very small values threshold (< $0.01).
   * This is the minimum value for formatWithThreshold and should align with
   * the 6 decimal maximum (0.000001 is the smallest representable value).
   */
  VERY_SMALL: 0.000001,
} as const;

/**
 * Configuration for a specific number range formatting.
 */
export type FiatRangeConfig = {
  /**
   * The condition to match for this range (e.g., < 0.0001, < 1, >= 1000).
   * Function should return true if this config should be applied.
   */
  condition: (value: number) => boolean;
  /** Minimum decimal places for this range. */
  minimumDecimals: number;
  /** Maximum decimal places for this range. */
  maximumDecimals: number;
  /** Optional threshold for formatWithThreshold (defaults to the range boundary). */
  threshold?: number;
  /** Optional significant digits for this range (overrides decimal places when set). */
  significantDigits?: number;
  /** Optional custom formatting logic for this range. */
  customFormat?: (value: number, locale: string, currency: string) => string;
  /** Optional flag to strip trailing zeros for this range (overrides global stripTrailingZeros option). */
  stripTrailingZeros?: boolean;
  /**
   * Optional flag for fiat-style stripping (only strips .00, preserves meaningful decimals like .10, .40).
   * When true, "$1,250.00" → "$1,250" but "$1,250.10" stays "$1,250.10".
   * When false (default), strips all trailing zeros: "$1,250.10" → "$1,250.1".
   */
  fiatStyleStripping?: boolean;
};

/**
 * Legacy type alias kept for backwards compatibility with the previous
 * extension-only PerpsPriceRange signature. Prefer FiatRangeConfig.
 */
export type PerpsPriceRange = FiatRangeConfig;

/**
 * Formats a number to a specific number of significant digits.
 * Strips trailing zeros unless minDecimals requires them.
 *
 * @param value - The numeric value to format.
 * @param significantDigits - Number of significant digits to maintain.
 * @param minDecimals - Minimum decimal places to show (may add zeros).
 * @param maxDecimals - Maximum decimal places allowed.
 * @returns Formatted number with appropriate precision, trailing zeros removed.
 */
export function formatWithSignificantDigits(
  value: number,
  significantDigits: number,
  minDecimals?: number,
  maxDecimals?: number,
): { value: number; decimals: number } {
  // Handle special cases
  if (value === 0) {
    return { value: 0, decimals: minDecimals ?? 0 };
  }

  const absValue = Math.abs(value);

  if (absValue >= 1) {
    let targetDecimals: number;

    const integerDigits = Math.floor(Math.log10(absValue)) + 1;
    const decimalsNeeded = significantDigits - integerDigits;
    targetDecimals = Math.max(decimalsNeeded, 0);

    if (minDecimals !== undefined && targetDecimals < minDecimals) {
      targetDecimals = minDecimals;
    }

    const finalDecimals =
      maxDecimals === undefined
        ? targetDecimals
        : Math.min(targetDecimals, maxDecimals);

    const roundedValue = Number(value.toFixed(finalDecimals));

    return {
      value: roundedValue,
      decimals: finalDecimals,
    };
  }

  const precisionStr = absValue.toPrecision(significantDigits);
  const precisionNum = parseFloat(precisionStr);

  const valueStr = precisionNum.toString();
  const [, decPart = ''] = valueStr.split('.');
  let actualDecimals = decPart.length;

  if (minDecimals !== undefined && actualDecimals < minDecimals) {
    actualDecimals = minDecimals;
  }
  if (maxDecimals !== undefined && actualDecimals > maxDecimals) {
    actualDecimals = maxDecimals;
  }

  return {
    value: value < 0 ? -precisionNum : precisionNum,
    decimals: actualDecimals,
  };
}

/**
 * Minimal view fiat range configuration.
 * Uses fiat-style stripping for clean currency display.
 * Strips only .00 to avoid partial decimals like $1,250.1.
 */
export const PRICE_RANGES_MINIMAL_VIEW: FiatRangeConfig[] = [
  {
    // Large values (>= $1000): Strip .00 only ($5,000 not $5,000.00, but $5,000.10 stays)
    condition: (val: number) => Math.abs(val) >= PRICE_THRESHOLD.LARGE,
    minimumDecimals: 2,
    maximumDecimals: 2,
    threshold: PRICE_THRESHOLD.LARGE,
    stripTrailingZeros: true,
    fiatStyleStripping: true,
  },
  {
    // Small values (< $1000): Also use fiat-style stripping ($100 not $100.00, but $13.40 stays)
    condition: () => true,
    minimumDecimals: 2,
    maximumDecimals: 2,
    threshold: PRICE_THRESHOLD.LOW,
    stripTrailingZeros: true,
    fiatStyleStripping: true,
  },
];

/**
 * Universal price range configuration following comprehensive rules from rules-decimals.md.
 *
 * Rules:
 * - Max 6 decimals across all ranges (Hyperliquid limit)
 * - Strip trailing zeros by default
 * - Use |v| (absolute value) for conditions
 *
 * Significant digits by range:
 * - > $100,000: 6 sig digs
 * - $100,000 > x > $0.01: 5 sig digs
 * - < $0.01: 4 sig digs
 *
 * Decimal limits by price range:
 * - |v| > 10,000: min 0, max 0 decimals; 5 sig digs (6 if >100k)
 * - |v| > 1,000: min 0, max 1 decimal; 5 sig digs
 * - |v| > 100: min 0, max 2 decimals; 5 sig digs
 * - |v| > 10: min 0, max 4 decimals; 5 sig digs
 * - |v| ≥ 0.01: 5 sig digs, min 2, max 6 decimals
 * - |v| < 0.01: 4 sig digs, min 2, max 6 decimals
 */
export const PRICE_RANGES_UNIVERSAL: FiatRangeConfig[] = [
  {
    // Very high values (> $100,000): No decimals, 6 significant figures
    condition: (val) => Math.abs(val) > PRICE_THRESHOLD.VERY_HIGH,
    minimumDecimals: 0,
    maximumDecimals: 0,
    significantDigits: 6,
    threshold: PRICE_THRESHOLD.VERY_HIGH,
  },
  {
    // High values ($10,000-$100,000]: No decimals, 5 significant figures
    condition: (val) => Math.abs(val) > PRICE_THRESHOLD.HIGH,
    minimumDecimals: 0,
    maximumDecimals: 0,
    significantDigits: 5,
    threshold: PRICE_THRESHOLD.HIGH,
  },
  {
    // Large values ($1,000-$10,000]: Max 1 decimal, 5 significant figures
    condition: (val) => Math.abs(val) > PRICE_THRESHOLD.LARGE,
    minimumDecimals: 0,
    maximumDecimals: 1,
    significantDigits: 5,
    threshold: PRICE_THRESHOLD.LARGE,
  },
  {
    // Medium values ($100-$1,000]: Max 2 decimals, 5 significant figures
    condition: (val) => Math.abs(val) > PRICE_THRESHOLD.MEDIUM,
    minimumDecimals: 0,
    maximumDecimals: 2,
    significantDigits: 5,
    threshold: PRICE_THRESHOLD.MEDIUM,
  },
  {
    // Medium-low values ($10-$100]: Max 4 decimals, 5 significant figures
    condition: (val) => Math.abs(val) > PRICE_THRESHOLD.MEDIUM_LOW,
    minimumDecimals: 0,
    maximumDecimals: 4,
    significantDigits: 5,
    threshold: PRICE_THRESHOLD.MEDIUM_LOW,
  },
  {
    // Low values ($0.01-$10]: 5 significant figures, min 2 max MAX_PRICE_DECIMALS decimals
    condition: (val) => Math.abs(val) >= PRICE_THRESHOLD.LOW,
    significantDigits: 5,
    minimumDecimals: 2,
    maximumDecimals: DECIMAL_PRECISION_CONFIG.MaxPriceDecimals,
    threshold: PRICE_THRESHOLD.LOW,
  },
  {
    // Very small values (< $0.01): 4 significant figures, min 2 max MAX_PRICE_DECIMALS decimals
    condition: () => true,
    significantDigits: 4,
    minimumDecimals: 2,
    maximumDecimals: DECIMAL_PRECISION_CONFIG.MaxPriceDecimals,
    threshold: PRICE_THRESHOLD.VERY_SMALL,
  },
];

/**
 * Formats a balance value as USD currency with appropriate decimal places.
 *
 * @param balance - Raw numeric balance value.
 * @param options - Optional formatting options.
 * @param options.minimumDecimals - Global minimum decimal places.
 * @param options.maximumDecimals - Global maximum decimal places.
 * @param options.significantDigits - Global significant digits.
 * @param options.ranges - Custom range configurations (defaults to PRICE_RANGES_MINIMAL_VIEW).
 * @param options.currency - Currency code (default: 'USD').
 * @param options.locale - Locale for formatting (default: 'en-US').
 * @param options.stripTrailingZeros - Strip trailing zeros from output.
 * @returns Formatted currency string with variable decimals based on configured ranges.
 */
export const formatPerpsFiat = (
  balance: string | number,
  options?: {
    minimumDecimals?: number;
    maximumDecimals?: number;
    significantDigits?: number;
    ranges?: FiatRangeConfig[];
    currency?: string;
    locale?: string;
    stripTrailingZeros?: boolean;
  },
): string => {
  const value = typeof balance === 'string' ? parseFloat(balance) : balance;
  const currency = options?.currency ?? 'USD';

  let formatted: string;

  if (isNaN(value)) {
    return PERPS_CONSTANTS.FallbackPriceDisplay;
  }

  const ranges = options?.ranges ?? PRICE_RANGES_MINIMAL_VIEW;

  const rangeConfig = ranges.find((range) => range.condition(value));

  if (rangeConfig) {
    const sigDigits =
      options?.significantDigits ?? rangeConfig.significantDigits;

    if (sigDigits) {
      const minDecimals =
        options?.minimumDecimals ?? rangeConfig.minimumDecimals;
      const maxDecimals =
        options?.maximumDecimals ?? rangeConfig.maximumDecimals;

      const { value: formattedValue, decimals } = formatWithSignificantDigits(
        value,
        sigDigits,
        minDecimals,
        maxDecimals,
      );

      formatted = _formatWithThreshold(
        formattedValue,
        rangeConfig.threshold ?? 0.01,
        {
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        },
      );
    } else {
      const minDecimals =
        options?.minimumDecimals ?? rangeConfig.minimumDecimals;
      const maxDecimals =
        options?.maximumDecimals ?? rangeConfig.maximumDecimals;

      if (rangeConfig.customFormat) {
        formatted = rangeConfig.customFormat(
          value,
          options?.locale ?? 'en-US',
          currency,
        );
      } else {
        formatted = _formatWithThreshold(value, rangeConfig.threshold ?? 0.01, {
          currency,
          minimumFractionDigits: minDecimals,
          maximumFractionDigits: maxDecimals,
        });
      }
    }
  } else {
    const fallbackMin = options?.minimumDecimals ?? 2;
    const fallbackMax = options?.maximumDecimals ?? 2;
    formatted = _formatWithThreshold(value, 0.01, {
      currency,
      minimumFractionDigits: fallbackMin,
      maximumFractionDigits: fallbackMax,
    });
  }

  if (options?.stripTrailingZeros === false) {
    return formatted;
  }

  const shouldStrip =
    rangeConfig?.stripTrailingZeros ?? options?.stripTrailingZeros ?? true;

  if (shouldStrip) {
    const useFiatStyle = rangeConfig?.fiatStyleStripping ?? false;

    if (useFiatStyle) {
      return formatted.replace(/\.00$/u, '');
    }
    return formatted.replace(/(\.\d*?)0+$/u, '$1').replace(/\.$/u, '');
  }

  return formatted;
};

/**
 * Formats position size with variable decimal precision based on magnitude or asset-specific decimals.
 * Removes trailing zeros to match task requirements.
 *
 * @param size - Raw position size value.
 * @param szDecimals - Optional asset-specific decimal precision from Hyperliquid metadata.
 * @returns Format varies by size or uses asset-specific decimals, with trailing zeros removed.
 */
export const formatPositionSize = (
  size: string | number,
  szDecimals?: number,
): string => {
  const value = typeof size === 'string' ? parseFloat(size) : size;

  if (isNaN(value) || value === 0) {
    return '0';
  }

  if (szDecimals !== undefined) {
    const fixed = value.toFixed(szDecimals);
    // Only strip trailing zeros when a decimal point is present; toFixed(0)
    // returns an integer string and the regex would otherwise eat valid zeros.
    return fixed.includes('.') ? fixed.replace(/\.?0+$/u, '') : fixed;
  }

  const abs = Math.abs(value);
  let formatted: string;

  if (abs < 0.01) {
    formatted = value.toFixed(6);
  } else if (abs < 1) {
    formatted = value.toFixed(4);
  } else {
    formatted = value.toFixed(2);
  }

  return formatted.replace(/\.?0+$/u, '');
};

/**
 * Formats a PnL (Profit and Loss) value with sign prefix.
 *
 * @param pnl - Raw numeric PnL value (positive for profit, negative for loss).
 * @returns Format: "+$X,XXX.XX" or "-$X,XXX.XX" (always shows sign, 2 decimals).
 */
export const formatPnl = (pnl: string | number): string => {
  const value = typeof pnl === 'string' ? parseFloat(pnl) : pnl;

  if (isNaN(value)) {
    return PERPS_CONSTANTS.ZeroAmountDetailedDisplay;
  }

  const formatted = _formatCurrency(Math.abs(value), 'USD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return value >= 0 ? `+${formatted}` : `-${formatted}`;
};

/**
 * Formats a percentage value with sign prefix.
 *
 * @param value - Raw percentage value (e.g., 5.25 for 5.25%, not 0.0525).
 * @param decimals - Number of decimal places to show (default: 2).
 * @returns Format: "+X.XX%" or "-X.XX%" (always shows sign, 2 decimals).
 */
export const formatPercentage = (
  value: string | number,
  decimals: number = 2,
): string => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(parsed)) {
    return '0.00%';
  }

  return `${parsed >= 0 ? '+' : ''}${parsed.toFixed(decimals)}%`;
};

/**
 * Formats funding rate for display.
 *
 * @param value - Raw funding rate value (decimal, not percentage).
 * @param options - Optional formatting options.
 * @param options.showZero - Whether to return zero display value for zero/undefined (default: true).
 * @returns Formatted funding rate as percentage string.
 */
export const formatFundingRate = (
  value?: number | null,
  options?: { showZero?: boolean },
): string => {
  const showZero = options?.showZero ?? true;

  if (value === undefined || value === null) {
    return showZero ? FUNDING_RATE_CONFIG.ZeroDisplay : '';
  }

  const percentage = value * FUNDING_RATE_CONFIG.PercentageMultiplier;
  const formatted = percentage.toFixed(FUNDING_RATE_CONFIG.Decimals);

  if (showZero && parseFloat(formatted) === 0) {
    return FUNDING_RATE_CONFIG.ZeroDisplay;
  }

  return `${formatted}%`;
};

// ---------------------------------------------------------------------------
// Legacy formatPerpsPrice — predates the mobile sync. Kept for extension
// call sites that haven't migrated to formatPerpsFiat yet.
// ---------------------------------------------------------------------------

const legacyFormatterCache = new Map<string, Intl.NumberFormat>();

function getLegacyFormatter(
  locale: string,
  minDec: number,
  maxDec: number,
  sigDigits: number,
): Intl.NumberFormat {
  const key = `${locale}:${minDec}:${maxDec}:${sigDigits}`;
  let fmt = legacyFormatterCache.get(key);
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
    legacyFormatterCache.set(key, fmt);
  }
  return fmt;
}

/**
 * Format a perps asset price using adaptive significant-digit rules.
 * Legacy helper — prefer formatPerpsFiat(value, { ranges: PRICE_RANGES_UNIVERSAL })
 * for new call sites.
 *
 * @param value - Numeric price value (e.g. 3245.67890123).
 * @param locale - BCP 47 locale string (e.g. 'en-US'). Defaults to 'en-US'.
 * @param ranges - Optional range config override. Defaults to PRICE_RANGES_UNIVERSAL.
 * @returns Formatted price string (e.g. '$3,245.7', '$0.000123').
 */
export function formatPerpsPrice(
  value: number,
  locale = 'en-US',
  ranges: FiatRangeConfig[] = PRICE_RANGES_UNIVERSAL,
): string {
  if (!Number.isFinite(value)) {
    return '';
  }

  const range = ranges.find((r) => r.condition(value));

  if (!range || range.significantDigits === undefined) {
    return getLegacyFormatter(locale, 2, 2, 2).format(value);
  }

  return getLegacyFormatter(
    locale,
    range.minimumDecimals,
    range.maximumDecimals,
    range.significantDigits,
  ).format(value);
}

// ---------------------------------------------------------------------------
// Order calculation helpers
// Mirrored from metamask-mobile/app/controllers/perps/utils/orderCalculations.ts.
// ---------------------------------------------------------------------------

type PositionSizeParams = {
  amount: string;
  price: number;
  szDecimals: number;
};

type MarginRequiredParams = {
  amount: string;
  leverage: number;
};

/**
 * Calculate position size based on USD amount and asset price.
 *
 * @param params - Amount in USD, current asset price, and required decimal precision.
 * @returns Position size formatted to the asset's decimal precision.
 */
export function calculatePositionSize(params: PositionSizeParams): string {
  const { amount, price, szDecimals } = params;

  if (szDecimals === undefined || szDecimals === null) {
    throw new Error('szDecimals is required for position size calculation');
  }
  if (szDecimals < 0) {
    throw new Error(`szDecimals must be >= 0, got: ${szDecimals}`);
  }

  const amountNum = parseFloat(amount || '0');

  if (isNaN(amountNum) || isNaN(price) || amountNum === 0 || price === 0) {
    return (0).toFixed(szDecimals);
  }

  const positionSize = amountNum / price;
  const multiplier = Math.pow(10, szDecimals);
  let rounded = Math.round(positionSize * multiplier) / multiplier;

  // Ensure rounded size meets requested USD (fix validation gap).
  const actualUsd = rounded * price;
  if (actualUsd < amountNum) {
    rounded += 1 / multiplier;
  }

  return rounded.toFixed(szDecimals);
}

/**
 * Calculate margin required for a position.
 *
 * @param params - Position amount and leverage.
 * @returns Margin required formatted to 2 decimal places.
 */
export function calculateMarginRequired(params: MarginRequiredParams): string {
  const { amount, leverage } = params;
  const amountNum = parseFloat(amount || '0');

  if (
    isNaN(amountNum) ||
    isNaN(leverage) ||
    amountNum === 0 ||
    leverage === 0
  ) {
    return '0.00';
  }

  return (amountNum / leverage).toFixed(2);
}
