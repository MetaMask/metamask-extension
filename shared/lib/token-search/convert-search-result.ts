import {
  parseCaipAssetType,
  type CaipAssetType,
  type CaipChainId,
  type Hex,
} from '@metamask/utils';
import { isNativeAddress } from '@metamask/bridge-controller';

import { type TokenSearchResult } from './token-search-api';

/**
 * Normalised representation of a single token search result that downstream
 * import / hide actions can dispatch against without re-parsing CAIP ids.
 */
export type SearchResultImportPayload = {
  assetId: CaipAssetType;
  caipChainId: CaipChainId;
  assetReference: string;
  assetNamespace: string;
  hexChainId?: Hex;
  isEvm: boolean;
  isNative: boolean;
  symbol: string;
  decimals: number;
  name: string;
  iconUrl?: string;
};

/**
 * @param result - Single token entry as returned by the Token API.
 * @returns The normalised payload, or `undefined` when the result is unusable.
 */
export const convertSearchResultToImportPayload = (
  result: TokenSearchResult,
): SearchResultImportPayload | undefined => {
  let parsed;
  try {
    parsed = parseCaipAssetType(result.assetId as CaipAssetType);
  } catch {
    return undefined;
  }
  const { chainId: caipChainId, assetReference, assetNamespace } = parsed;
  if (!caipChainId || !assetReference) {
    return undefined;
  }

  const isEvm = caipChainId.startsWith('eip155:');
  let hexChainId: Hex | undefined;
  if (isEvm) {
    const [, reference] = caipChainId.split(':');
    const decimal = Number(reference);
    if (!Number.isFinite(decimal)) {
      return undefined;
    }
    hexChainId = `0x${decimal.toString(16)}` as Hex;
  }

  const isNative =
    assetNamespace === 'slip44' || (isEvm && isNativeAddress(assetReference));

  return {
    assetId: result.assetId as CaipAssetType,
    caipChainId,
    assetReference,
    assetNamespace,
    hexChainId,
    isEvm,
    isNative,
    symbol: result.symbol,
    decimals: result.decimals,
    name: result.name,
    iconUrl: result.iconUrl,
  };
};
