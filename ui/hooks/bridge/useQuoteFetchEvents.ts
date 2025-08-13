/* eslint-disable camelcase */
import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  formatProviderLabel,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import {
  getBridgeQuotes,
  getQuoteRequest,
  getValidationErrors,
} from '../../ducks/bridge/selectors';
import { trackUnifiedSwapBridgeEvent } from '../../ducks/bridge/actions';

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
  const { insufficientBal } = useSelector(getQuoteRequest);
  const validationErrors = useSelector(getValidationErrors);

  const warnings = useMemo(() => {
    const {
      isEstimatedReturnLow,
      isNoQuotesAvailable,
      isInsufficientGasBalance,
      isInsufficientGasForQuote,
      isInsufficientBalance,
    } = validationErrors;

    const latestWarnings = [];

    isEstimatedReturnLow && latestWarnings.push('low_return');
    isNoQuotesAvailable && latestWarnings.push('no_quotes');
    isInsufficientGasBalance && latestWarnings.push('insufficient_gas_balance');
    isInsufficientGasForQuote &&
      latestWarnings.push('insufficient_gas_for_selected_quote');
    isInsufficientBalance && latestWarnings.push('insufficient_balance');

    return latestWarnings;
  }, [validationErrors]);

  // TODO fix error where this is published on every load
  // Emitted each time quotes are fetched successfully
  useEffect(() => {
    if (!isLoading && quotesRefreshCount >= 0 && !quoteFetchError) {
      dispatch(
        trackUnifiedSwapBridgeEvent(UnifiedSwapBridgeEventName.QuotesReceived, {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          can_submit: !insufficientBal,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          gas_included: Boolean(activeQuote?.quote?.gasIncluded),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          quoted_time_minutes: activeQuote?.estimatedProcessingTimeInSeconds
            ? activeQuote.estimatedProcessingTimeInSeconds / 60
            : 0,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_quoted_gas: Number(activeQuote?.gasFee?.effective?.usd ?? 0),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_quoted_return: Number(activeQuote?.toTokenAmount?.usd ?? 0),
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          best_quote_provider: recommendedQuote
            ? formatProviderLabel(recommendedQuote.quote)
            : undefined,
          provider: activeQuote ? formatProviderLabel(activeQuote.quote) : '_',
          warnings,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          price_impact: Number(activeQuote?.quote.priceData?.priceImpact ?? 0),
        }),
      );
    }
  }, [activeQuote]);
};
