import { CaipChainId } from '@metamask/utils';
import { BridgeClientId } from '@metamask/bridge-controller';
import { STATIC_METAMASK_BASE_URL } from '../../constants/bridge';
import fetchWithCache from '../../lib/fetch-with-cache';
import { TOKEN_API_BASE_URL } from '../../constants/swaps';

import { validateResponse, ASSET_VALIDATORS } from './validators';

const CLIENT_ID_HEADER = { 'X-Client-Id': BridgeClientId.EXTENSION };

type TokenV3Asset = {
  assetId: string;
  symbol: string;
  name: string;
  decimals: number;
};

// Returns a list of non-EVM assets
export async function fetchNonEvmTokens(
  chainId: CaipChainId,
): Promise<Record<string, TokenV3Asset>> {
  const url = `${TOKEN_API_BASE_URL}/v3/chains/${chainId}/assets?first=15000`;
  const { data: tokens } = await fetchWithCache({
    url,
    fetchOptions: { method: 'GET', headers: CLIENT_ID_HEADER },
    cacheOptions: { cacheRefreshTime: 60000 },
    functionName: 'fetchNonEvmTokens',
  });

  const transformedTokens: Record<string, TokenV3Asset> = {};
  tokens.forEach((token: unknown) => {
    if (validateResponse<TokenV3Asset>(ASSET_VALIDATORS, token, url, false)) {
      transformedTokens[token.assetId] = token;
    }
  });
  return transformedTokens;
}

export const isTokenV3Asset = (asset: object): asset is TokenV3Asset => {
  return 'assetId' in asset && typeof asset.assetId === 'string';
};

// Returns the image url for a caip-formatted asset
export const getAssetImageUrl = (assetId: string) =>
  `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/${assetId?.replaceAll(
    ':',
    '/',
  )}.png`;
