import { BigNumber } from 'bignumber.js';
import { type QuoteResponse } from '@metamask/bridge-controller';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';
import { formatAmount } from '../../confirmations/components/simulation-details/formatAmount';
import type { BridgeToken } from '../../../ducks/bridge/types';

export const formatTokenAmount = (
  locale: string,
  amount: string,
  symbol: string = '',
  roundingMode?: number,
) => {
  const stringifiedAmount = formatAmount(
    locale,
    new BigNumber(amount),
    roundingMode,
  );

  return [stringifiedAmount, symbol].join(' ').trim();
};

// $999 trillion — the largest value displayed verbatim before switching to the
// ">$999T" cap. This is safely within Number.MAX_SAFE_INTEGER (~9e15) so the
// currency formatter produces accurate comma-separated output without rounding.
const MAX_FIAT_DISPLAY = new BigNumber('999000000000000');

// BTC has 8 significant decimal places; ETH displays are typically ≤8 places.
// We don't need all 18 wei decimals since these are human-readable amounts.
const MAX_DYNAMIC_PRECISION = 18;

export const formatCurrencyAmount = (
  stringifiedDecAmount: string | null | undefined,
  currency: string,
  precision: number = DEFAULT_PRECISION,
) => {
  if (!stringifiedDecAmount) {
    return undefined;
  }
  const amount = new BigNumber(stringifiedDecAmount);

  if (precision === 0) {
    if (amount.lt(0.01)) {
      return '<$0.01';
    }
    if (amount.lt(1)) {
      return formatCurrency(amount.toFixed(2), currency, 2);
    }
  }

  // Cap extremely large values. BigNumber.toString() uses scientific notation
  // for big numbers (e.g. "2.37e+27") which confuses the currency formatter.
  // toFixed() always produces a plain decimal string.
  if (amount.gt(MAX_FIAT_DISPLAY)) {
    return `>${formatCurrency(MAX_FIAT_DISPLAY.toFixed(0), currency, 0)}`;
  }

  // When the display currency is ETH or BTC the callers pass precision=2, but
  // a value like 0.000123 ETH would round to "0.00". Bump precision until we
  // find the first non-zero representation, up to MAX_DYNAMIC_PRECISION.
  if (amount.gt(0) && new BigNumber(amount.toFixed(precision)).isZero()) {
    for (let p = precision + 1; p <= MAX_DYNAMIC_PRECISION; p++) {
      if (!new BigNumber(amount.toFixed(p)).isZero()) {
        return formatCurrency(amount.toFixed(p), currency, p);
      }
    }
    // Value is smaller than 10^-MAX_DYNAMIC_PRECISION; show a "less than" label.
    const minAmount = new BigNumber(10).pow(-MAX_DYNAMIC_PRECISION);
    return `<${formatCurrency(minAmount.toFixed(MAX_DYNAMIC_PRECISION), currency, MAX_DYNAMIC_PRECISION)}`;
  }

  return formatCurrency(amount.toFixed(precision), currency, precision);
};

// TOOD: add currency symbol for crypto currencies in source/dest amount inputs

/**
 * Formats network fees with dynamic precision to avoid showing $0.00 for non-zero fees.
 * If fees are less than $0.01, increases decimal places up to 4 until the first non-zero digit is shown.
 * If fees are non-zero but smaller than $0.0001, rounds up to $0.0001.
 *
 * @param stringifiedDecAmount - The fee amount as a string
 * @param currency - The currency code (e.g., 'USD')
 * @returns Formatted currency string with appropriate precision
 */
export function formatNetworkFee(
  stringifiedDecAmount: string | null | undefined,
  currency: string,
): string | undefined {
  if (!stringifiedDecAmount) {
    return undefined;
  }

  const amount = new BigNumber(stringifiedDecAmount);

  // If amount is zero, return formatted zero
  if (amount.isZero()) {
    return formatCurrency(amount.toFixed(2), currency, 2);
  }

  // If amount is >= $0.01, use standard 2 decimal places
  if (amount.gte(0.01)) {
    return formatCurrency(amount.toFixed(2), currency, 2);
  }

  // For amounts < $0.01, find the precision that shows the first non-zero digit
  // Try precision from 2 to 4 (max allowed)
  for (let precision = 2; precision <= 4; precision++) {
    // Scale the amount by 10^precision to move the target digit to the ones place
    // Example: 0.0005 with precision 3 → 0.5 (moves 3rd decimal to ones place)
    const scaleFactor = new BigNumber(10).pow(precision);
    const scaledAmount = amount.times(scaleFactor);

    // Round using ROUND_HALF_UP to match currency formatter's rounding behavior
    // If the rounded value is non-zero, this precision will show a non-zero digit
    const roundedValue = scaledAmount.round(0, BigNumber.ROUND_HALF_UP);

    if (roundedValue.gt(0)) {
      return formatCurrency(amount.toFixed(precision), currency, precision);
    }
  }

  // If after 4 decimal places it's still showing as zero but original amount > 0,
  // round up to $0.0001
  if (amount.gt(0)) {
    return formatCurrency('0.0001', currency, 4);
  }

  // Fallback to 2 decimal places
  return formatCurrency(amount.toString(), currency, 2);
}

export const formatProviderLabel = (args?: {
  bridgeId: QuoteResponse['quote']['bridgeId'];
  bridges: QuoteResponse['quote']['bridges'];
}): `${string}_${string}` => `${args?.bridgeId}_${args?.bridges[0]}`;

export const sanitizeAmountInput = (
  textToSanitize: string,
  dropNumbersAfterSecondDecimal = true,
) => {
  // Remove non-numeric and non-decimal characters
  const cleanedString = textToSanitize.replace(/[^\d.]+/gu, '');
  // Find first decimal point and use its index to split the string into two parts
  const pointIndex = cleanedString.indexOf('.');
  const firstPart = cleanedString.slice(0, pointIndex + 1);
  const secondPart = dropNumbersAfterSecondDecimal
    ? // Ignore digits after second decimal point
      cleanedString.slice(pointIndex + 1).split('.')[0]
    : // Preserve digits after second decimal point
      cleanedString.slice(pointIndex + 1).replace(/[^\d]+/gu, '');

  return [firstPart, secondPart].filter(Boolean).join('');
};

/**
 * Sanitizes the amount string for BigNumber calculations by converting empty strings or single decimal points to '0'.
 *
 * @param amount - The raw amount string from input
 * @returns A safe string for BigNumber operations
 */
export const safeAmountForCalc = (
  amount: string | null | undefined,
): string => {
  if (!amount) {
    return '0';
  }
  const sanitized = sanitizeAmountInput(amount);
  return sanitized === '' || sanitized === '.' ? '0' : sanitized;
};

export const isQuoteExpiredOrInvalid = ({
  activeQuote,
  toToken,
  isQuoteExpired,
}: {
  activeQuote: QuoteResponse | null;
  toToken: BridgeToken | null;
  isQuoteExpired: boolean;
}): boolean => {
  // 1. Ignore quotes that are expired
  if (isQuoteExpired) {
    return true;
  }

  // 2. Ensure the quote still matches the currently selected destination asset / chain
  if (activeQuote && toToken) {
    return (
      activeQuote.quote.destAsset.assetId.toLowerCase() !==
      toToken.assetId.toLowerCase()
    );
  }

  return false;
};
