import { queryOptions } from '@tanstack/react-query';
import {
  DEFAULT_MAX_REFRESH_COUNT,
  FeatureId,
  REFRESH_INTERVAL_MS,
  type GenericQuoteRequest,
  type QuoteResponseV1,
} from '@metamask/bridge-controller';
import { fetchQuotes } from '../../../store/controller-actions/bridge-controller';

export const bridgeQuotesDefaultRefreshIntervalMs = REFRESH_INTERVAL_MS;
export const bridgeQuotesDefaultMaxRefreshCount = DEFAULT_MAX_REFRESH_COUNT;

export type BridgeQuotesQueryParams = Pick<
  GenericQuoteRequest,
  | 'walletAddress'
  | 'destWalletAddress'
  | 'srcChainId'
  | 'destChainId'
  | 'srcTokenAddress'
  | 'destTokenAddress'
  | 'srcTokenAmount'
  | 'slippage'
  | 'insufficientBal'
  | 'gasIncluded'
  | 'gasIncluded7702'
>;

export type BridgeQuotesQueryOptions = {
  refetchIntervalMs?: number;
  maxRefreshCount?: number;
  featureId?: FeatureId;
};

export const bridgeQuotesKeys = {
  all: () => ['bridge', 'quotes'] as const,
  detail: (params: BridgeQuotesQueryParams) =>
    [
      ...bridgeQuotesKeys.all(),
      String(params.srcChainId ?? ''),
      String(params.destChainId ?? ''),
      String(params.srcTokenAddress ?? ''),
      String(params.destTokenAddress ?? ''),
      String(params.srcTokenAmount ?? ''),
      String(params.walletAddress ?? ''),
      String(params.destWalletAddress ?? ''),
      params.slippage ?? null,
      Boolean(params.insufficientBal),
      Boolean(params.gasIncluded),
      Boolean(params.gasIncluded7702),
    ] as const,
};

export const bridgeQuotesOptions = (
  params: BridgeQuotesQueryParams,
  options: BridgeQuotesQueryOptions = {},
) => {
  const refetchIntervalMs =
    options.refetchIntervalMs ?? bridgeQuotesDefaultRefreshIntervalMs;
  const maxRefreshCount =
    options.maxRefreshCount ?? bridgeQuotesDefaultMaxRefreshCount;
  const featureId = options.featureId ?? FeatureId.UNIFIED_SWAP_BRIDGE;

  return queryOptions({
    queryKey: bridgeQuotesKeys.detail(params),
    queryFn: async (): Promise<QuoteResponseV1[]> =>
      fetchQuotes(params as GenericQuoteRequest, featureId),
    staleTime: refetchIntervalMs,
    refetchInterval: (query) => {
      if (query.state.dataUpdateCount >= maxRefreshCount) {
        return false;
      }
      return refetchIntervalMs;
    },
  });
};
