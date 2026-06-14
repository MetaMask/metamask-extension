// TODO: Once all usages of tokensChainsCache are removed from this repo, this
// fetching logic should be moved to the core package (e.g. TokenListController
// or a dedicated tokens API service), and this hook should be updated to read
// from Redux state rather than calling the API directly.
import { useState, useEffect } from 'react';
import { handleFetch } from '@metamask/controller-utils';

export type TokenAsset = {
  assetId: string;
  decimals?: number;
  iconUrl: string;
  name: string;
  symbol: string;
};

const TOKEN_API_V3_BASE_URL = 'https://tokens.api.cx.metamask.io/v3';

// Maximum number of asset IDs per API request. Requests with more IDs are
// split into parallel batches of this size.
export const MAX_BATCH_SIZE = 25;

// Module-level cache and in-flight deduplication so multiple hook instances
// share a single HTTP request for the same batch of asset IDs.
const tokenCache: Record<string, TokenAsset> = {};
const inFlight = new Map<string, Promise<TokenAsset[]>>();

function fetchTokenBatch(assetIds: string[]): Promise<TokenAsset[]> {
  const normalizedIds = assetIds.map((id) => id.toLowerCase());
  const key = normalizedIds.join(',');

  const existing = inFlight.get(key);
  if (existing !== undefined) {
    return existing;
  }

  if (normalizedIds.every((id) => tokenCache[id])) {
    return Promise.resolve(normalizedIds.map((id) => tokenCache[id]));
  }

  const params = new URLSearchParams({
    assetIds: normalizedIds.join(','),
    includeIconUrl: 'true',
  });

  const promise = (async () => {
    try {
      const data: TokenAsset[] = await handleFetch(
        `${TOKEN_API_V3_BASE_URL}/assets?${params}`,
      );
      // Normalize keys to lowercase so they match the locally-constructed
      // asset IDs (addresses are lowercased before building the CAIP-19 ID).
      // The API may return EIP-55 checksummed addresses (e.g. 0xABc…) which
      // would otherwise cause every cache lookup and state lookup to miss.
      data.forEach((t) => {
        tokenCache[t.assetId.toLowerCase()] = t;
      });
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

async function fetchTokenAssets(assetIds: string[]): Promise<TokenAsset[]> {
  const batches: string[][] = [];
  for (let i = 0; i < assetIds.length; i += MAX_BATCH_SIZE) {
    batches.push(assetIds.slice(i, i + MAX_BATCH_SIZE));
  }
  const results = await Promise.all(batches.map(fetchTokenBatch));
  return results.flat();
}

/**
 * Fetches token metadata (name, symbol, iconUrl) for the given CAIP-19 asset IDs
 * from the MetaMask tokens API.
 *
 * Large inputs are automatically split into parallel batches of at most
 * {@link MAX_BATCH_SIZE} IDs to keep individual requests within a safe size.
 * Each batch is independently cached and deduplicated so that multiple
 * simultaneous hook instances for the same assets share a single HTTP request.
 *
 * @param assetIds - Array of CAIP-19 asset identifiers (e.g. "eip155:1/erc20:0xabc…")
 * @returns A map from asset ID to {@link TokenAsset} for all resolved tokens.
 */
export function useTokensData(assetIds: string[]): Record<string, TokenAsset> {
  const assetIdsKey = assetIds.join(',');

  const [tokensByAssetId, setTokensByAssetId] = useState<
    Record<string, TokenAsset>
  >(() =>
    Object.fromEntries(
      assetIds
        .filter((id) => tokenCache[id.toLowerCase()])
        .map((id) => [id.toLowerCase(), tokenCache[id.toLowerCase()]]),
    ),
  );

  useEffect(() => {
    if (!assetIdsKey) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await fetchTokenAssets(assetIdsKey.split(','));
        if (!cancelled) {
          setTokensByAssetId((prev) => ({
            ...prev,
            ...Object.fromEntries(
              data.map((t) => [t.assetId.toLowerCase(), t]),
            ),
          }));
        }
      } catch {
        // silently ignore fetch errors
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [assetIdsKey]);

  return tokensByAssetId;
}
