import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { QuoteResponse, QuoteRequest } from '../types';

export const isValidQuoteRequest = (
  partialRequest: Partial<QuoteRequest>,
  requireAmount = true,
): partialRequest is QuoteRequest => {
  const STRING_FIELDS = ['srcTokenAddress', 'destTokenAddress'];
  if (requireAmount) {
    STRING_FIELDS.push('srcTokenAmount');
  }
  const NUMBER_FIELDS = ['srcChainId', 'destChainId', 'slippage'];

  return (
    STRING_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'string' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        partialRequest[field as keyof typeof partialRequest] !== '' &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    ) &&
    NUMBER_FIELDS.every(
      (field) =>
        field in partialRequest &&
        typeof partialRequest[field as keyof typeof partialRequest] ===
          'number' &&
        partialRequest[field as keyof typeof partialRequest] !== undefined &&
        !isNaN(Number(partialRequest[field as keyof typeof partialRequest])) &&
        partialRequest[field as keyof typeof partialRequest] !== null,
    )
  );
};

export const getQuoteDisplayData = (quoteResponse?: QuoteResponse) => {
  const { quote, estimatedProcessingTimeInSeconds } = quoteResponse ?? {};
  if (!quoteResponse || !quote || !estimatedProcessingTimeInSeconds) {
    return {};
  }

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
      amount: '0.01 ETH', // TODO implement gas + relayer fee
      fiat: '$0.01',
    },
    quoteRate,
  };
};
