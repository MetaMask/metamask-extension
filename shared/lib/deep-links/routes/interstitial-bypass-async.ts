import { QueryClient } from '@tanstack/react-query';
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { searchTokens } from '../../token-search/token-search-api';
import { AssetQueryParams } from './asset';
import type { Route } from './route';

const API_TIMEOUT_MS = 2_000;
const API_STALE_TIME_MS = 60_000;

let queryClient: QueryClient | undefined;
const getQueryClient = () => {
  queryClient ??= new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return queryClient;
};

const createTimeoutSignal = (
  signal?: AbortSignal,
  timeoutMs = API_TIMEOUT_MS,
): AbortSignal => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const abortFromParent = () => {
    clearTimeout(timeoutId);
    controller.abort();
  };

  if (signal?.aborted) {
    abortFromParent();
  } else if (signal) {
    signal.addEventListener('abort', abortFromParent, { once: true });
  }

  return controller.signal;
};

type IsKnownSafeDeepLinkAssetOptions = {
  lookupTimeoutMs?: number;
};

export async function isKnownSafeDeepLinkAsset(
  assetId: string,
  options?: IsKnownSafeDeepLinkAssetOptions,
): Promise<boolean> {
  if (!isCaipAssetType(assetId)) {
    return false;
  }

  const { assetNamespace, assetReference, chainId } =
    parseCaipAssetType(assetId);
  if (assetNamespace === 'slip44') {
    return true;
  }

  try {
    const response = await getQueryClient().fetchQuery({
      queryKey: ['deepLinkTokenSearch', chainId, assetReference],
      queryFn: ({ signal }) =>
        searchTokens({
          query: assetReference,
          networks: [chainId],
          includeTokenSecurityData: true,
          first: 10,
          signal: createTimeoutSignal(signal, options?.lookupTimeoutMs),
        }),
      staleTime: API_STALE_TIME_MS,
    });

    const asset = response.data?.find(
      (entry) => entry.assetId.toLowerCase() === assetId.toLowerCase(),
    );

    if (!asset) {
      return false;
    }

    const SPAM_SECURITY_RESULT_TYPE = 'Spam';
    return asset.securityData?.resultType !== SPAM_SECURITY_RESULT_TYPE;
  } catch {
    return false;
  }
}

export async function canBypassDeepLinkInterstitialAsync(
  route?: Pick<Route, 'pathname'>,
  deepLinkUrl?: URL,
): Promise<boolean> {
  if (route?.pathname === '/asset' && deepLinkUrl) {
    const assetId = deepLinkUrl.searchParams.get(AssetQueryParams.AssetId);
    if (!assetId) {
      return false;
    }

    return isKnownSafeDeepLinkAsset(assetId);
  }

  return false;
}
