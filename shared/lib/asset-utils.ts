import {
  CaipAssetType,
  parseCaipChainId,
  CaipAssetTypeStruct,
  CaipChainId,
  type Hex,
  isCaipAssetType,
  isCaipChainId,
  isStrictHexString,
  parseCaipAssetType,
} from '@metamask/utils';

import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { MultichainNetwork } from '@metamask/multichain-transactions-controller';
import {
  getNativeAssetForChainId,
  isNativeAddress,
} from '@metamask/bridge-controller';
import getFetchWithTimeout from '../modules/fetch-with-timeout';
import { decimalToPrefixedHex } from '../modules/conversion.utils';
import { TEN_SECONDS_IN_MILLISECONDS } from './transactions-controller-utils';

const TOKEN_API_V3_BASE_URL = 'https://tokens.api.cx.metamask.io/v3';
const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';

export const toAssetId = (
  address: Hex | CaipAssetType | string,
  chainId: CaipChainId,
): CaipAssetType | undefined => {
  if (isCaipAssetType(address)) {
    return address;
  }
  if (isNativeAddress(address)) {
    return getNativeAssetForChainId(chainId)?.assetId;
  }
  if (chainId === MultichainNetwork.Solana) {
    return CaipAssetTypeStruct.create(`${chainId}/token:${address}`);
  }
  // EVM assets
  if (isStrictHexString(address)) {
    return CaipAssetTypeStruct.create(
      `${chainId}/erc20:${address.toLowerCase()}`,
    );
  }
  return undefined;
};

/**
 * Returns the image url for a caip-formatted asset
 *
 * @param assetId - The hex address or caip-formatted asset id
 * @param chainId - The chainId in caip or hex format
 * @returns The image url for the asset
 */
export const getAssetImageUrl = (
  assetId: CaipAssetType | string,
  chainId: CaipChainId | Hex,
) => {
  const chainIdInCaip = isCaipChainId(chainId)
    ? chainId
    : toEvmCaipChainId(chainId);

  const assetIdInCaip = toAssetId(assetId, chainIdInCaip);
  if (!assetIdInCaip) {
    return undefined;
  }

  return `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/${assetIdInCaip.replaceAll(
    ':',
    '/',
  )}.png`;
};

export type AssetMetadata = {
  assetId: CaipAssetType;
  symbol: string;
  name: string;
  decimals: number;
};

/**
 * Fetches the metadata for a token
 *
 * @param address - The address of the token
 * @param chainId - The chainId of the token
 * @param abortSignal - The abort signal for the fetch request
 * @returns The metadata for the token
 */
export const fetchAssetMetadata = async (
  address: string | CaipAssetType | Hex,
  chainId: Hex | CaipChainId,
  abortSignal?: AbortSignal,
) => {
  try {
    const chainIdInCaip = isCaipChainId(chainId)
      ? chainId
      : toEvmCaipChainId(chainId);

    const assetId = toAssetId(address, chainIdInCaip);

    if (!assetId) {
      return undefined;
    }
    const fetchWithTimeout = getFetchWithTimeout(TEN_SECONDS_IN_MILLISECONDS);

    const [assetMetadata]: AssetMetadata[] = await (
      await fetchWithTimeout(
        `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${assetId}`,
        {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
          signal: abortSignal,
        },
      )
    ).json();

    const commonFields = {
      symbol: assetMetadata.symbol,
      decimals: assetMetadata.decimals,
      image: getAssetImageUrl(assetId, chainIdInCaip),
      assetId,
    };

    if (chainId === MultichainNetwork.Solana && assetId) {
      const { assetReference } = parseCaipAssetType(assetId);
      return {
        ...commonFields,
        address: assetReference,
        assetId,
        chainId,
      };
    }

    const { reference } = parseCaipChainId(chainIdInCaip);
    return {
      ...commonFields,
      address: address.toLowerCase(),
      chainId: decimalToPrefixedHex(reference),
    };
  } catch (error) {
    return undefined;
  }
};

/**
 * Fetches the metadata for a list of token assetIds
 *
 * @param assetIds - The assetIds of the tokens
 * @param abortSignal - The abort signal for the fetch request
 * @returns The metadata for the tokens by assetId
 */
export const fetchAssetMetadataForAssetIds = async (
  assetIds: (CaipAssetType | null)[],
  abortSignal?: AbortSignal,
) => {
  try {
    const fetchWithTimeout = getFetchWithTimeout(TEN_SECONDS_IN_MILLISECONDS);
    const assetIdsString = assetIds
      .map((assetId) => {
        if (!assetId) {
          return null;
        }
        const { assetReference } = parseCaipAssetType(assetId);
        if (isStrictHexString(assetReference)) {
          return assetId.toLowerCase();
        }
        return assetId;
      })
      .filter(Boolean)
      .join(',');
    if (!assetIdsString) {
      return {};
    }
    const assetMetadata: AssetMetadata[] = await (
      await fetchWithTimeout(
        `${TOKEN_API_V3_BASE_URL}/assets?assetIds=${assetIdsString}`,
        {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
          signal: abortSignal,
        },
      )
    ).json();

    return assetMetadata.reduce(
      (acc, asset) => {
        acc[asset.assetId] = asset;
        return acc;
      },
      {} as Record<CaipAssetType, AssetMetadata>,
    );
  } catch (error) {
    return null;
  }
};
