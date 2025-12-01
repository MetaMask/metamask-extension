import { BigNumber } from 'bignumber.js';
import {
  type QuoteResponse,
  formatChainIdToCaip,
  formatAddressToCaipReference,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { type CaipChainId, type Hex } from '@metamask/utils';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { formatAmount } from '../../confirmations/components/simulation-details/formatAmount';

export const formatTokenAmount = (
  locale: string,
  amount: string,
  symbol: string = '',
) => {
  const stringifiedAmount = formatAmount(locale, new BigNumber(amount));

  return [stringifiedAmount, symbol].join(' ').trim();
};

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
      return formatCurrency(amount.toString(), currency, 2);
    }
  }
  return formatCurrency(amount.toString(), currency, precision);
};

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
    return formatCurrency(amount.toString(), currency, 2);
  }

  // If amount is >= $0.01, use standard 2 decimal places
  if (amount.gte(0.01)) {
    return formatCurrency(amount.toString(), currency, 2);
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
      return formatCurrency(amount.toString(), currency, precision);
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
  toChainId,
  fromChainId,
  isQuoteExpired,
  insufficientBal,
}: {
  activeQuote: QuoteResponse | null;
  toToken: BridgeToken | null;
  toChainId?: Hex | CaipChainId;
  fromChainId?: Hex | CaipChainId;
  isQuoteExpired: boolean;
  insufficientBal?: boolean;
}): boolean => {
  // 1. Ignore quotes that are expired (unless the only reason is an `insufficientBal` override for non-EVM chains)
  if (
    isQuoteExpired &&
    (!insufficientBal ||
      // `insufficientBal` is always true for non-EVM chains (Solana, Bitcoin)
      (fromChainId && isNonEvmChainId(fromChainId)))
  ) {
    return true;
  }

  // 2. Ensure the quote still matches the currently selected destination asset / chain
  if (activeQuote && toToken) {
    const destChainId = activeQuote.quote?.destChainId;

    // For non-EVM chains (Solana, Bitcoin, Tron), don't use toLowerCase() as addresses
    // are case-sensitive (base58 encoding uses both upper and lowercase letters)
    const isNonEvmDest = destChainId && isNonEvmChainId(destChainId);

    // Extract raw addresses from CAIP-19 format if present
    // The bridge API returns plain addresses, but UI may store CAIP-19 asset IDs
    const quoteDestAddressRaw = activeQuote.quote?.destAsset?.address
      ? formatAddressToCaipReference(activeQuote.quote.destAsset.address)
      : '';
    const selectedDestAddressRaw = toToken.address
      ? formatAddressToCaipReference(toToken.address)
      : '';

    // For EVM chains, normalize to lowercase for comparison (addresses are case-insensitive)
    // For non-EVM chains, preserve case (base58 addresses are case-sensitive)
    const quoteDestAddress = isNonEvmDest
      ? quoteDestAddressRaw
      : quoteDestAddressRaw.toLowerCase();
    const selectedDestAddress = isNonEvmDest
      ? selectedDestAddressRaw
      : selectedDestAddressRaw.toLowerCase();

    const quoteDestChainIdCaip = destChainId
      ? formatChainIdToCaip(destChainId)
      : '';
    const selectedDestChainIdCaip = toChainId
      ? formatChainIdToCaip(toChainId)
      : '';

    const addressMatch =
      quoteDestAddress === selectedDestAddress ||
      (isNativeAddress(quoteDestAddress) &&
        isNativeAddress(selectedDestAddress));
    const chainMatch = quoteDestChainIdCaip === selectedDestChainIdCaip;
    const isInvalid = !(addressMatch && chainMatch);

    return isInvalid;
  }

  return false;
};
