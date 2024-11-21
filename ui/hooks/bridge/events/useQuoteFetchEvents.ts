/* eslint-disable camelcase */
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  getBridgeQuotes,
  getFromAmount,
  getQuoteRequest,
} from '../../../ducks/bridge/selectors';
import { useCrossChainSwapsEventTracker } from '../useCrossChainSwapsEventTracker';
import { useRequestMetadataProperties } from './useRequestMetadataProperties';
import { useRequestProperties } from './useRequestProperties';
import { useTradeProperties } from './useTradeProperties';
import { useConvertedUsdAmounts } from './useConvertedUsdAmounts';

// This hook is used to track cross chain swaps events related to quote-fetching
export const useQuoteFetchEvents = () => {
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const {
    isLoading,
    quotesRefreshCount,
    quoteFetchError,
    quotesInitialLoadTimeMs,
  } = useSelector(getBridgeQuotes);
  const { insufficientBal, srcTokenAddress } = useSelector(getQuoteRequest);
  const fromTokenInputValue = useSelector(getFromAmount);

  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const { usd_amount_source } = useConvertedUsdAmounts();

  const has_sufficient_funds = !insufficientBal;

  // Emitted when quotes are fetched for the first time for a given request
  useEffect(() => {
    const isInitialFetch =
      isLoading &&
      quotesRefreshCount === 0 &&
      quotesInitialLoadTimeMs === undefined;

    if (
      quoteRequestProperties &&
      fromTokenInputValue &&
      srcTokenAddress &&
      isInitialFetch
    ) {
      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.CrossChainSwapsQuotesRequested,
        properties: {
          ...quoteRequestProperties,
          ...requestMetadataProperties,
          has_sufficient_funds,
          usd_amount_source,
        },
      });
    }
  }, [isLoading, quotesInitialLoadTimeMs]);

  // Emitted when an error is caught during fetch
  useEffect(() => {
    if (
      quoteRequestProperties &&
      fromTokenInputValue &&
      srcTokenAddress &&
      quoteFetchError
    ) {
      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.QuoteError,
        properties: {
          ...quoteRequestProperties,
          ...requestMetadataProperties,
          has_sufficient_funds,
          usd_amount_source,
          error_message: quoteFetchError,
        },
      });
    }
  }, [quoteFetchError]);
};
