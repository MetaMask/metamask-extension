import { useSelector } from 'react-redux';
import { getBridgeQuotes } from '../../ducks/bridge/selectors';
import { useMemo, useState } from 'react';
import { calcTokenAmount } from '../../../shared/lib/transactions-controller-utils';
import useBridgeAmounts from './useBridgeAmounts';
import { mapValues, orderBy } from 'lodash';
import BigNumber from 'bignumber.js';

enum SortOrder {
  ADJUSTED_RETURN_DESC,
  ETA_ASC,
}

const MAXIMUM_ETA_SECONDS = 60 * 60; // 1 hour
const MAXIMUM_RETURN_VALUE_DIFFERENCE_PERCENTAGE = 0.8; // if a quote returns in x times less return than the best quote, ignore it

const useBridgeQuotes = () => {
  const { quotes } = useSelector(getBridgeQuotes);

  const [sortOrder, setSortOrder] = useState<SortOrder>(
    SortOrder.ADJUSTED_RETURN_DESC,
  );

  const quotesByRequestId = useMemo(() => {
    return Object.fromEntries(
      quotes.map((quote) => [quote.quote.requestId, quote]),
    );
  }, [quotes]);

  const { toAmounts, gasFees, relayerFees, swapRates } = useBridgeAmounts();

  // Returns {[requestId]: toAmount - gasFees - relayerFees } in fiat
  const adjustedReturnByRequestId = useMemo(() => {
    return mapValues(
      // TODO check that this actually works
      toAmounts,
      (toAmount, requestId) => {
        return toAmount.fiat
          ?.minus(gasFees?.[requestId].fiat ?? 0)
          .minus(relayerFees?.[requestId].fiat ?? 0);
      },
    );
  }, [toAmounts, gasFees, relayerFees]);

  const sortedRequestIds = useMemo(() => {
    switch (sortOrder) {
      case SortOrder.ETA_ASC:
        // Returns [requestId...] sorted by ETA in ascending order
        return orderBy(
          Object.entries(quotesByRequestId),
          ([, value]) => value.estimatedProcessingTimeInSeconds,
          'asc', // Sort in descending order (highest to lowest)
        ).map(([key]) => key);
      case SortOrder.ADJUSTED_RETURN_DESC:
      default:
        // Returns [requestId...] sorted by adjusted return in descending order
        return orderBy(
          Object.entries(adjustedReturnByRequestId),
          ([, value]) => value,
          'desc', // Sort in descending order (highest to lowest)
        ).map(([key]) => key);
    }
  }, [quotesByRequestId, adjustedReturnByRequestId, sortOrder]);

  const recommendedQuote = useMemo(() => {
    if (!sortedRequestIds.length) return undefined;

    console.log('====adjustedReturnByRequestId', {
      adjustedReturnByRequestId,
      toAmounts,
      gasFees,
      relayerFees,
    });
    const bestReturnValue = BigNumber.max(
      Object.values(adjustedReturnByRequestId).map((x) => x ?? 0),
    );
    const isFastestQuoteValueReasonable = (currentRequestId: string) =>
      adjustedReturnByRequestId?.[currentRequestId]
        ? adjustedReturnByRequestId[currentRequestId]
            .div(bestReturnValue)
            .gte(MAXIMUM_RETURN_VALUE_DIFFERENCE_PERCENTAGE)
        : true;

    const isBestPricedQuoteETAReasonable = (currentRequestId: string) =>
      quotesByRequestId[currentRequestId].estimatedProcessingTimeInSeconds <
      MAXIMUM_ETA_SECONDS;

    return quotesByRequestId[
      sortedRequestIds.find((requestId: string) => {
        return sortOrder === SortOrder.ETA_ASC
          ? isFastestQuoteValueReasonable(requestId)
          : isBestPricedQuoteETAReasonable(requestId);
      }) ?? sortedRequestIds[0]
    ];
  }, [sortedRequestIds]);

  // TODO test for excessive re-renders
  const toAmount = useMemo(() => {
    return recommendedQuote
      ? calcTokenAmount(
          recommendedQuote.quote.destTokenAmount,
          recommendedQuote.quote.destAsset.decimals,
        )
          .toFixed(3)
          .toString()
      : undefined;
  }, [recommendedQuote]);

  return {
    recommendedQuote,
    toAmount,
    sortedQuotes: sortedRequestIds.map(
      (requestId) => quotesByRequestId[requestId],
    ),
    setSortOrder,
    quoteMetadata: { toAmounts, gasFees, relayerFees, swapRates },
  };
};

export default useBridgeQuotes;
