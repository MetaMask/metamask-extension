/* eslint-disable camelcase */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  getQuotesReceivedProperties,
  UnifiedSwapBridgeEventName,
  type QuoteWarning,
} from '@metamask/bridge-controller';
import {
  getBridgeQuotes,
  getFromTokenBalanceInUsd,
  getWarningLabels,
  type BridgeAppState,
} from '../../ducks/bridge/selectors';
import { trackUnifiedSwapBridgeEvent } from '../../ducks/bridge/actions';
import { useIsTxSubmittable } from './useIsTxSubmittable';

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
  const allWarnings = useSelector((state) =>
    getWarningLabels(state as BridgeAppState, Date.now()),
  );
  const warnings = allWarnings.filter(
    (w): w is QuoteWarning => w !== 'market_closed',
  );
  const fromTokenBalanceInUsd = useSelector(getFromTokenBalanceInUsd);

  // Emitted each time quotes are fetched successfully
  useEffect(() => {
    if (!isLoading && quotesRefreshCount > 0 && !quoteFetchError) {
      dispatch(
        trackUnifiedSwapBridgeEvent(
          UnifiedSwapBridgeEventName.QuotesReceived,
          getQuotesReceivedProperties(
            activeQuote,
            warnings,
            isTxSubmittable,
            recommendedQuote,
            fromTokenBalanceInUsd,
          ),
        ),
      );
    }
  }, [quotesRefreshCount]);
};
