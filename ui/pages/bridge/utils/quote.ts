import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { QuoteResponse } from '../types';

export const getQuoteDisplayData = (quoteResponse?: QuoteResponse) => {
  const { quote, estimatedProcessingTimeInSeconds } = quoteResponse ?? {};
  if (!quoteResponse || !quote || !estimatedProcessingTimeInSeconds) return {};

  const etaInMinutes = (estimatedProcessingTimeInSeconds / 60).toFixed();
  const quoteRate = `1 ${quote.srcAsset.symbol} = ${calcTokenAmount(
    quote.destTokenAmount,
    quote.destAsset.decimals,
  )
    .div(calcTokenAmount(quote.srcTokenAmount, quote.srcAsset.decimals))
    .toFixed(4)
    .toString()} ${quote.destAsset.symbol}`;

  return {
    etaInMinutes,
    totalFees: {
      amount: '0.01 ETH', // TODO implement
      fiat: '$0.01',
    },
    quoteRate,
  };
};
