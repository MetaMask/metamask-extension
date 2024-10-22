import { shallowEqual, useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getToTokenExchangeRates,
} from '../../ducks/bridge/selectors';
import { useMemo, useState } from 'react';
import { orderBy } from 'lodash';
import BigNumber from 'bignumber.js';
import { QuoteMetadata, QuoteResponse } from '../../pages/bridge/types';
import { getTokenExchangeRates } from '../../selectors';
import {
  getConversionRate,
  getGasFeeEstimates,
} from '../../ducks/metamask/metamask';
import { decGWEIToHexWEI } from '../../../shared/modules/conversion.utils';
import {
  calcAdjustedReturn,
  calcSentAmount,
  calcSwapRate,
  calcToAmount,
  calcTotalNetworkFee,
} from '../../pages/bridge/utils/quote';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { add0x } from '@metamask/utils';

enum SortOrder {
  ADJUSTED_RETURN_DESC,
  ETA_ASC,
}

const MAXIMUM_ETA_SECONDS = 60 * 60; // 1 hour
const MAXIMUM_RETURN_VALUE_DIFFERENCE_PERCENTAGE = 0.8; // if a quote returns in x times less return than the best quote, ignore it

const useBridgeQuotes = (): {
  sortedQuotes: (QuoteResponse & QuoteMetadata)[];
  recommendedQuote: (QuoteResponse & QuoteMetadata) | undefined;
  sortOrder: SortOrder;
  setSortOrder: (sortOrder: SortOrder) => void;
} => {
  const { quotes } = useSelector(getBridgeQuotes);

  const [sortOrder, setSortOrder] = useState<SortOrder>(
    SortOrder.ADJUSTED_RETURN_DESC,
  );
  // Exchange rates
  const fromTokenExchangeRates: Record<string, number> = useSelector(
    getTokenExchangeRates,
    shallowEqual,
  );
  const fromNativeExchangeRate = useSelector(getConversionRate);
  const { toNativeExchangeRate, toTokenExchangeRate } = useSelector(
    getToTokenExchangeRates,
  );
  // Gas prices
  const gasFeeEstimates = useSelector<GasFeeEstimates>(getGasFeeEstimates);
  const maxFeePerGas: string = decGWEIToHexWEI(
    (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxFeePerGas,
  );
  const maxPriorityFeePerGas: string = decGWEIToHexWEI(
    (gasFeeEstimates as GasFeeEstimates)?.high?.suggestedMaxPriorityFeePerGas,
  );

  const quotesWithMetadata = useMemo(() => {
    const calculateMetadata = (quote: QuoteResponse): QuoteMetadata => {
      const toTokenAmount = calcToAmount(
        quote.quote,
        toTokenExchangeRate,
        toNativeExchangeRate,
      );
      const totalNetworkFee = calcTotalNetworkFee(
        quote,
        add0x(maxFeePerGas),
        add0x(maxPriorityFeePerGas),
        fromNativeExchangeRate,
      );
      const sentAmount = calcSentAmount(
        quote.quote,
        fromTokenExchangeRates,
        fromNativeExchangeRate,
      );
      return {
        toTokenAmount,
        sentAmount,
        totalNetworkFee,
        adjustedReturn: calcAdjustedReturn(
          toTokenAmount.fiat,
          totalNetworkFee.fiat,
        ),
        swapRate: calcSwapRate(sentAmount.raw, toTokenAmount.raw),
      };
    };

    return quotes.map((quote) => ({ ...quote, ...calculateMetadata(quote) }));
  }, [
    quotes,
    toTokenExchangeRate,
    toNativeExchangeRate,
    fromTokenExchangeRates,
    fromNativeExchangeRate,
    maxFeePerGas,
    maxPriorityFeePerGas,
  ]);

  const sortedQuotesWithMetadata = useMemo(() => {
    switch (sortOrder) {
      case SortOrder.ETA_ASC:
        return orderBy(
          quotesWithMetadata,
          (quote) => quote.estimatedProcessingTimeInSeconds,
          'asc',
        );
      case SortOrder.ADJUSTED_RETURN_DESC:
      default:
        return orderBy(
          quotesWithMetadata,
          (quotesWithMetadata) => quotesWithMetadata.adjustedReturn.fiat,
          'desc',
        );
    }
  }, [quotesWithMetadata, sortOrder]);

  const recommendedQuote = useMemo(() => {
    if (!sortedQuotesWithMetadata.length) return undefined;

    const bestReturnValue = BigNumber.max(
      sortedQuotesWithMetadata.map(
        ({ adjustedReturn }) => adjustedReturn.fiat ?? 0,
      ),
    );
    const isFastestQuoteValueReasonable = (
      adjustedReturnInFiat: BigNumber | null,
    ) =>
      adjustedReturnInFiat
        ? adjustedReturnInFiat
            .div(bestReturnValue)
            .gte(MAXIMUM_RETURN_VALUE_DIFFERENCE_PERCENTAGE)
        : true;

    const isBestPricedQuoteETAReasonable = (
      estimatedProcessingTimeInSeconds: number,
    ) => estimatedProcessingTimeInSeconds < MAXIMUM_ETA_SECONDS;

    return (
      sortedQuotesWithMetadata.find((quote) => {
        return sortOrder === SortOrder.ETA_ASC
          ? isFastestQuoteValueReasonable(quote.adjustedReturn.fiat)
          : isBestPricedQuoteETAReasonable(
              quote.estimatedProcessingTimeInSeconds,
            );
      }) ?? sortedQuotesWithMetadata[0]
    );
  }, [sortedQuotesWithMetadata]);

  return {
    sortedQuotes: sortedQuotesWithMetadata,
    recommendedQuote,
    sortOrder,
    setSortOrder,
  };

  // TODO test for excessive re-renders
};

export default useBridgeQuotes;
