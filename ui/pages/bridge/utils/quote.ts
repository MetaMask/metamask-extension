import { BigNumber } from 'bignumber.js';
import { type QuoteResponse } from '@metamask/bridge-controller';
import { formatCurrency } from '../../../helpers/utils/confirm-tx.util';
import { DEFAULT_PRECISION } from '../../../hooks/useCurrencyDisplay';
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
