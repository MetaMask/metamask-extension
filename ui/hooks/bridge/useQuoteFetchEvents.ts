/* eslint-disable camelcase */
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { MetaMetricsEventName } from '../../../shared/constants/metametrics';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromToken,
  getQuoteRequest,
  getValidationErrors,
} from '../../ducks/bridge/selectors';
import { useCrossChainSwapsEventTracker } from './useCrossChainSwapsEventTracker';
import useLatestBalance from './useLatestBalance';
import { useRequestMetadataProperties } from './events/useRequestMetadataProperties';
import { useRequestProperties } from './events/useRequestProperties';
import { useTradeProperties } from './events/useTradeProperties';
import { useConvertedUsdAmounts } from './events/useConvertedUsdAmounts';
import { useQuoteProperties } from './events/useQuoteProperties';

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
  const validationErrors = useSelector(getValidationErrors);

  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { usd_amount_source } = useConvertedUsdAmounts();

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const has_sufficient_funds = !insufficientBal;

  const quoteListProperties = useQuoteProperties();
  const tradeProperties = useTradeProperties();

  const fromToken = useSelector(getFromToken);
  const fromChain = useSelector(getFromChain);

  const balanceAmount = useLatestBalance(fromToken);
  const nativeAsset = useMemo(
    () =>
      fromChain?.chainId ? getNativeAssetForChainId(fromChain.chainId) : null,
    [fromChain?.chainId],
  );
  const nativeAssetBalance = useLatestBalance(nativeAsset);

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
    isInsufficientGasBalance(nativeAssetBalance) &&
      latestWarnings.push('insufficient_gas_balance');
    isInsufficientGasForQuote(nativeAssetBalance) &&
      latestWarnings.push('insufficient_gas_for_selected_quote');
    isInsufficientBalance(balanceAmount) &&
      latestWarnings.push('insufficient_balance');

    return latestWarnings;
  }, [validationErrors]);

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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_sufficient_funds,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
        event: MetaMetricsEventName.CrossChainSwapsQuoteError,
        properties: {
          ...quoteRequestProperties,
          ...requestMetadataProperties,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          has_sufficient_funds,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          usd_amount_source,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          error_message: quoteFetchError,
        },
      });
    }
  }, [quoteFetchError]);

  // Emitted after each time quotes are fetched successfully
  useEffect(() => {
    if (
      fromTokenInputValue &&
      srcTokenAddress &&
      !isLoading &&
      quotesRefreshCount >= 0 &&
      quoteListProperties.initial_load_time_all_quotes > 0 &&
      quoteRequestProperties &&
      !quoteFetchError &&
      tradeProperties
    ) {
      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.CrossChainSwapsQuotesReceived,
        properties: {
          ...quoteRequestProperties,
          ...requestMetadataProperties,
          ...quoteListProperties,
          ...tradeProperties,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          refresh_count: quotesRefreshCount - 1,
          warnings,
        },
      });
    }
  }, [quotesRefreshCount]);
};
