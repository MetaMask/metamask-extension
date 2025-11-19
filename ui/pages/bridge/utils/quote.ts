import { BigNumber } from 'bignumber.js';
import {
  type QuoteResponse,
  formatChainIdToCaip,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import type {
  NetworkConfiguration,
  AddNetworkFields,
} from '@metamask/network-controller';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';
import { formatAmount } from '../../confirmations/components/simulation-details/formatAmount';
import type { BridgeToken } from '../../../ducks/bridge/types';

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

export const sanitizeAmountInput = (textToSanitize: string) => {
  return (
    textToSanitize
      .replace(/[^\d.]+/gu, '')
      // Only allow one decimal point, ignore digits after second decimal point
      .split('.', 2)
      .join('.')
  );
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
  toChain,
  fromChain,
  isQuoteExpired,
  insufficientBal,
}: {
  activeQuote: QuoteResponse | null;
  toToken: BridgeToken | null;
  toChain?: NetworkConfiguration | AddNetworkFields;
  fromChain?: NetworkConfiguration;
  isQuoteExpired: boolean;
  insufficientBal?: boolean;
}): boolean => {
  // 1. Ignore quotes that are expired (unless the only reason is an `insufficientBal` override for non-EVM chains)
  if (
    isQuoteExpired &&
    (!insufficientBal ||
      // `insufficientBal` is always true for non-EVM chains (Solana, Bitcoin)
      (fromChain && isNonEvmChainId(fromChain.chainId)))
  ) {
    return true;
  }

  // 2. Ensure the quote still matches the currently selected destination asset / chain
  if (activeQuote && toToken) {
    const quoteDestAddress =
      activeQuote.quote?.destAsset?.address?.toLowerCase() || '';
    const selectedDestAddress = toToken.address?.toLowerCase() || '';

    const quoteDestChainIdCaip = activeQuote.quote?.destChainId
      ? formatChainIdToCaip(activeQuote.quote.destChainId)
      : '';
    const selectedDestChainIdCaip = toChain?.chainId
      ? formatChainIdToCaip(toChain.chainId)
      : '';

    return !(
      (quoteDestAddress === selectedDestAddress ||
        // Extension's native asset address may be different from bridge-api's native
        // asset address so if both assets are native, we should still return true
        (isNativeAddress(quoteDestAddress) &&
          isNativeAddress(selectedDestAddress))) &&
      quoteDestChainIdCaip === selectedDestChainIdCaip
    );
  }

  return false;
};
