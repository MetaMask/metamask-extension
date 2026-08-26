import { useEffect } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import {
  getQuotesReceivedProperties,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import {
  getBridgeQuotes,
  getFromTokenBalanceInUsd,
  getWarningLabels,
  type BridgeAppState,
} from '../../ducks/bridge/selectors';
import { trackUnifiedSwapBridgeEvent } from '../../ducks/bridge/actions';
import { endTrace, TraceName } from '../../../shared/lib/trace';
import { useDispatch } from '../../store/hooks';
import { useIsTxSubmittable } from './useIsTxSubmittable';
import { useHasSufficientGasForQuoteForMetrics } from './useHasSufficientGasForQuoteForMetrics';

// This hook is used to track cross chain swaps events related to quote-fetching
export const useQuoteFetchEvents = () => {
  const dispatch = useDispatch();
  const {
    isLoading,
    quotesRefreshCount,
    quoteFetchError,
    activeQuote,
    recommendedQuote,
  } = useSelector(getBridgeQuotes);
  const isTxSubmittable = useIsTxSubmittable();
  const warnings = useSelector(
    (state) => getWarningLabels(state as BridgeAppState, Date.now()),
    shallowEqual,
  );

  const fromTokenBalanceInUsd = useSelector(getFromTokenBalanceInUsd);

  const getHasSufficientGasForQuote = useHasSufficientGasForQuoteForMetrics();
  const hasSufficientGasForQuote = getHasSufficientGasForQuote(
    activeQuote ?? null,
  );

  const firstQuoteRequestId = recommendedQuote?.quote.requestId;

  // Emitted each time quotes are fetched successfully
  useEffect(() => {
    if (!isLoading && quotesRefreshCount > 0 && !quoteFetchError) {
      if (!firstQuoteRequestId) {
        endTrace({
          name: TraceName.SwapQuoteFetch,
          timestamp: Date.now(),
        });
      }
      dispatch(
        trackUnifiedSwapBridgeEvent(
          UnifiedSwapBridgeEventName.QuotesReceived,
          getQuotesReceivedProperties(
            activeQuote ?? null,
            warnings,
            isTxSubmittable,
            recommendedQuote,
            fromTokenBalanceInUsd,
            hasSufficientGasForQuote,
          ),
        ),
      );
    }
  }, [quotesRefreshCount]);

  // End the trace as soon as the first quote becomes available, including
  // while the controller is still streaming additional quotes.
  useEffect(() => {
    if (firstQuoteRequestId) {
      endTrace({
        name: TraceName.SwapQuoteFetch,
        timestamp: Date.now(),
      });
    }
  }, [firstQuoteRequestId]);

  useEffect(() => {
    if (quoteFetchError) {
      endTrace({
        name: TraceName.SwapQuoteFetch,
        timestamp: Date.now(),
        data: { success: false },
      });
    }
  }, [quoteFetchError]);

  useEffect(() => {
    return () => {
      endTrace({
        name: TraceName.SwapQuoteFetch,
        timestamp: Date.now(),
        data: { success: false },
      });
    };
  }, []);
};
