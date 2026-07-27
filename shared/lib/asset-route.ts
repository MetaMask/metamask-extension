import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
  isCaipChainId,
  parseCaipAssetType,
} from '@metamask/utils';

import { isEvmChainId, toAssetId } from './asset-utils';

export const ASSET_ROUTE = '/asset';

/**
 * Builds a CAIP-19 asset page path.
 *
 * @param assetId
 * @example
 * buildAssetRoutePath('eip155:42161/slip44:60')
 * // => '/asset/eip155:42161/eip155%3A42161%2Fslip44%3A60'
 */
export const buildAssetRoutePath = (assetId: CaipAssetType): string => {
  if (!isCaipAssetType(assetId)) {
    throw new Error('Invalid CAIP asset type');
  }

  const { chainId } = parseCaipAssetType(assetId);
  return `${ASSET_ROUTE}/${chainId}/${encodeURIComponent(assetId)}`;
};

const tryBuildAssetRoutePath = (
  assetId: CaipAssetType | string | undefined,
): string | undefined => {
  if (!assetId || !isCaipAssetType(assetId)) {
    return undefined;
  }

  try {
    return buildAssetRoutePath(assetId);
  } catch {
    return undefined;
  }
};

const decodeRouteParam = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

type BuildAssetRoutePathFromPartsOptions = {
  assetId?: CaipAssetType;
  isNative?: boolean;
};

/**
 * Builds a CAIP-19 asset page path from chain and address parts.
 * @param chainId
 * @param address
 * @param options
 */
export const buildAssetRoutePathFromParts = (
  chainId: Hex | CaipChainId,
  address?: string,
  options?: BuildAssetRoutePathFromPartsOptions,
): string | undefined => {
  if (options?.assetId) {
    const pathFromAssetId = tryBuildAssetRoutePath(options.assetId);
    if (pathFromAssetId) {
      return pathFromAssetId;
    }

    const normalizedAssetId = toAssetId(options.assetId, chainId);
    const pathFromNormalized = tryBuildAssetRoutePath(normalizedAssetId);
    if (pathFromNormalized) {
      return pathFromNormalized;
    }
  }

  const isNative = options?.isNative ?? !address;

  if (isNative) {
    const pathFromAddress = tryBuildAssetRoutePath(address);
    if (pathFromAddress) {
      return pathFromAddress;
    }

    const caipChainId = isCaipChainId(chainId)
      ? chainId
      : toEvmCaipChainId(chainId as Hex);

    try {
      const nativeAssetId = getNativeAssetForChainId(caipChainId)?.assetId;
      return tryBuildAssetRoutePath(nativeAssetId);
    } catch {
      return undefined;
    }
  }

  if (!address) {
    return undefined;
  }

  const pathFromAddress = tryBuildAssetRoutePath(address);
  if (pathFromAddress) {
    return pathFromAddress;
  }

  const assetId = toAssetId(address, chainId);
  return tryBuildAssetRoutePath(assetId);
};

export type AssetRouteParams = Partial<{
  chainId: Hex | CaipChainId;
  asset: string;
  id: string;
}>;

export type ResolvedAssetRoute = {
  chainId?: Hex | CaipChainId;
  asset?: string;
  id?: string;
  decodedAsset?: string;
  assetId?: CaipAssetType;
};

/**
 * Firefox and Chrome process the asset params differently due to how they handle decoding fragments.
 * E.g. With a route of `/asset/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AXXX`
 * (where the solana%3A5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp%2Ftoken%3AXXX is an encoded version of the asset id)
 *
 * - Chrome will decode the above path as `{chainId}/{asset}`
 * - Chrome will decode the `asset` param as solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:XXX
 * - Chrome will therefore leave the `id` param as undefined.
 *
 * - Firefox will decode the above path as `{chainId}/{asset}/{id}`
 * - Firefox will decode the `asset` param as solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
 * - Firefox will therefore leave the `id` param as token:XXX
 * @param params
 */
export const processAssetParams = (
  params: AssetRouteParams,
): ResolvedAssetRoute => {
  const { chainId, asset, id } = params;
  const isCaipChain = chainId ? isCaipChainId(chainId) : false;
  const rawAsset = isCaipChain && asset && id ? `${asset}/${id}` : asset;
  const decodedAsset = rawAsset ? decodeRouteParam(rawAsset) : undefined;
  return { chainId, asset, id, decodedAsset };
};

/**
 * Normalizes CAIP-19 asset routes into values the asset page can use for lookup.
 * NFT routes (hex chain id + contract address + token id) are passed through unchanged.
 * @param params
 */
export const resolveAssetRouteLookup = (
  params: AssetRouteParams,
): ResolvedAssetRoute => {
  const processed = processAssetParams(params);
  const { chainId, decodedAsset } = processed;

  if (!chainId || !decodedAsset || !isCaipAssetType(decodedAsset)) {
    return processed;
  }

  try {
    const parsed = parseCaipAssetType(decodedAsset);

    if (isEvmChainId(parsed.chainId)) {
      const isNative = parsed.assetNamespace === 'slip44';

      return {
        ...processed,
        chainId: parsed.chainId,
        id: undefined,
        decodedAsset: isNative ? undefined : parsed.assetReference,
        assetId: decodedAsset,
      };
    }

    return {
      ...processed,
      assetId: decodedAsset,
    };
  } catch {
    return processed;
  }
};
