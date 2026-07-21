import {
  isCaipAssetType,
  parseCaipAssetType,
  type CaipAssetType,
} from '@metamask/utils';
import getFetchWithTimeout from '../../fetch-with-timeout';
import { AssetQueryParams } from '../routes/asset';
import type { Route } from '../routes/route';

const TOKEN_API_V3_BASE_URL = 'https://tokens.api.cx.metamask.io/v3';

/**
 * Bound how long deeplink navigation waits on the Tokens API before failing
 * closed to the interstitial.
 */
const SAFE_ASSET_LOOKUP_TIMEOUT_MS = 5_000;

/**
 * Same default occurrence floor used by TokenList / token browse flows.
 */
export const MIN_SAFE_ASSET_OCCURRENCES = 3;

const METAMASK_AGGREGATOR = 'metamask';
const DYNAMIC_AGGREGATOR = 'dynamic';

export type TokenApiAssetSafetyData = {
  assetId: string;
  aggregators?: string[];
  occurrences?: number;
};

/**
 * Whether Tokens API listing data indicates a known-safe / curated asset.
 *
 * Mere presence on `/v3/assets` is not enough — scam tokens are returned too.
 * We treat an asset as safe when:
 * - it is listed by the MetaMask aggregator, or
 * - it has enough cross-list occurrences and at least one non-`dynamic` aggregator
 *
 * @param asset - Tokens API asset payload with aggregators/occurrences.
 * @returns `true` when the listing signals a known-safe asset.
 */
export function isTokenApiAssetListedAsSafe(
  asset: TokenApiAssetSafetyData,
): boolean {
  const aggregators = asset.aggregators ?? [];
  if (aggregators.includes(METAMASK_AGGREGATOR)) {
    return true;
  }

  const occurrences = asset.occurrences ?? 0;
  const hasNonDynamicAggregator = aggregators.some(
    (aggregator) => aggregator !== DYNAMIC_AGGREGATOR,
  );

  return occurrences >= MIN_SAFE_ASSET_OCCURRENCES && hasNonDynamicAggregator;
}

/**
 * Normalize CAIP-19 asset ids the way Tokens API expects (lowercase EVM refs).
 *
 * @param assetId - CAIP-19 asset id.
 * @returns Normalized asset id string for the Tokens API query.
 */
function normalizeAssetIdForTokenApi(assetId: CaipAssetType): string {
  const { assetNamespace, assetReference, chainId } =
    parseCaipAssetType(assetId);

  if (/^0x[a-fA-F0-9]+$/u.test(assetReference)) {
    return `${chainId}/${assetNamespace}:${assetReference.toLowerCase()}`;
  }

  return assetId;
}

/**
 * Resolves whether a CAIP-19 asset deep link target is known-safe via the
 * MetaMask Tokens API.
 *
 * Native (`slip44`) assets are trusted without a network call. All other
 * assets are checked against Tokens API listing signals. Failures / timeouts
 * fail closed (`false`) so the interstitial is shown.
 *
 * @param assetId - CAIP-19 asset id from the deep link.
 * @param abortSignal - Optional abort signal for the Tokens API request.
 * @returns `true` when the asset is considered known-safe.
 */
export async function isKnownSafeDeepLinkAsset(
  assetId: string,
  abortSignal?: AbortSignal,
): Promise<boolean> {
  if (!isCaipAssetType(assetId)) {
    return false;
  }

  const { assetNamespace } = parseCaipAssetType(assetId);
  if (assetNamespace === 'slip44') {
    return true;
  }

  try {
    const fetchWithTimeout = getFetchWithTimeout(SAFE_ASSET_LOOKUP_TIMEOUT_MS);
    const normalizedAssetId = normalizeAssetIdForTokenApi(assetId);
    const url = `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${encodeURIComponent(
      normalizedAssetId,
    )}&includeAggregators=true&includeOccurrences=true`;

    const response = await fetchWithTimeout(url, {
      method: 'GET',
      headers: { 'X-Client-Id': 'extension' },
      signal: abortSignal,
    });

    if (!response.ok) {
      return false;
    }

    const assets = (await response.json()) as TokenApiAssetSafetyData[];
    const asset =
      assets.find(
        (entry) =>
          entry.assetId.toLowerCase() === normalizedAssetId.toLowerCase(),
      ) ?? assets[0];

    if (!asset) {
      return false;
    }

    return isTokenApiAssetListedAsSafe(asset);
  } catch {
    return false;
  }
}

/**
 * Whether a parsed deep link may skip the phishing interstitial based on
 * route whitelist or a known-safe `/asset` target.
 *
 * @param route - Parsed deep-link route.
 * @param deepLinkUrl - Original deep-link URL (needed to read `assetId`).
 * @returns `true` when the interstitial can be skipped for route/asset reasons.
 */
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
