import { BigNumber } from 'bignumber.js';
import {
  type QuoteResponse,
  isSolanaChainId,
  formatChainIdToCaip,
  isNativeAddress,
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
  stringifiedDecAmount: string | null,
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

export const formatProviderLabel = (args?: {
  bridgeId: QuoteResponse['quote']['bridgeId'];
  bridges: QuoteResponse['quote']['bridges'];
}): `${string}_${string}` => `${args?.bridgeId}_${args?.bridges[0]}`;

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
  // 1. Ignore quotes that are expired (unless the only reason is an `insufficientBal` override for non-Solana chains)
  if (
    isQuoteExpired &&
    (!insufficientBal ||
      // `insufficientBal` is always true for Solana
      (fromChain && isSolanaChainId(fromChain.chainId)))
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
