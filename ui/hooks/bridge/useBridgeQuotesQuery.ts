import { useQuery } from '@tanstack/react-query';
import {
  FeatureId,
  isValidQuoteRequest,
  type QuoteResponseV1,
} from '@metamask/bridge-controller';
import { useSelector } from 'react-redux';
import {
  getBridgeFeatureFlags,
  getBridgeQuotes,
  getQuoteRefreshRate,
  getQuoteRequest,
} from '../../ducks/bridge/selectors';
import { getRemoteFeatureFlags } from '../../../shared/lib/selectors/remote-feature-flags';
import { bridgeQueries } from './queries';

export const bridgeQuotesTanStackQueryFlag = 'bridgeQuotesTanStackQuery';

export type UseBridgeQuotesQueryResult = {
  quotes: QuoteResponseV1[] | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: unknown | null;
  dataUpdatedAt: number;
  isQueryEnabled: boolean;
  reduxQuotes: ReturnType<typeof getBridgeQuotes>;
};

export function selectBridgeQuotesTanStackQueryEnabled(state: {
  metamask: {
    remoteFeatureFlags: Record<string, unknown>;
  };
}): boolean {
  return (
    getRemoteFeatureFlags(state)[bridgeQuotesTanStackQueryFlag] === true
  );
}

export function useBridgeQuotesQuery(options?: {
  enabled?: boolean;
}): UseBridgeQuotesQueryResult {
  const quoteRequest = useSelector(getQuoteRequest);
  const refreshRate = useSelector(getQuoteRefreshRate);
  const bridgeFeatureFlags = useSelector(getBridgeFeatureFlags);
  const reduxQuotes = useSelector(getBridgeQuotes);
  const remoteFlagEnabled = useSelector(selectBridgeQuotesTanStackQueryEnabled);

  const hasValidQuoteRequest = isValidQuoteRequest(quoteRequest);
  const isQueryEnabled =
    (options?.enabled ?? remoteFlagEnabled) && hasValidQuoteRequest;

  const maxRefreshCount = bridgeFeatureFlags.maxRefreshCount;

  const quotesQuery = useQuery({
    ...bridgeQueries.quotes.options(
      {
        walletAddress: quoteRequest.walletAddress ?? '',
        destWalletAddress: quoteRequest.destWalletAddress,
        srcChainId: quoteRequest.srcChainId ?? '',
        destChainId: quoteRequest.destChainId ?? '',
        srcTokenAddress: quoteRequest.srcTokenAddress ?? '',
        destTokenAddress: quoteRequest.destTokenAddress ?? '',
        srcTokenAmount: quoteRequest.srcTokenAmount ?? '',
        slippage: quoteRequest.slippage,
        insufficientBal: quoteRequest.insufficientBal,
        gasIncluded: Boolean(quoteRequest.gasIncluded),
        gasIncluded7702: Boolean(quoteRequest.gasIncluded7702),
      },
      {
        refetchIntervalMs: refreshRate,
        maxRefreshCount,
        featureId: FeatureId.UNIFIED_SWAP_BRIDGE,
      },
    ),
    enabled: isQueryEnabled,
  });

  const isLoading = isQueryEnabled
    ? quotesQuery.isLoading
    : Boolean(reduxQuotes.isLoading);
  const isFetching = isQueryEnabled
    ? quotesQuery.isFetching
    : Boolean(reduxQuotes.isLoading);
  const isError = isQueryEnabled
    ? quotesQuery.isError
    : Boolean(reduxQuotes.quoteFetchError);
  const error = isQueryEnabled
    ? (quotesQuery.error ?? null)
    : (reduxQuotes.quoteFetchError ?? null);

  return {
    // Dual-read: prefer TanStack cache when the migration path is active.
    quotes: isQueryEnabled ? (quotesQuery.data ?? null) : null,
    isLoading,
    isFetching,
    isError,
    error,
    dataUpdatedAt: quotesQuery.dataUpdatedAt,
    isQueryEnabled,
    reduxQuotes,
  };
}
