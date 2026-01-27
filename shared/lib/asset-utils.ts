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
  KnownCaipNamespace,
} from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import {
  getNativeAssetForChainId,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { Asset } from '@metamask/assets-controllers';
import getFetchWithTimeout from '../modules/fetch-with-timeout';
import { decimalToPrefixedHex } from '../modules/conversion.utils';
import { MultichainNetworks } from '../constants/multichain/networks';
import {
  TRON_RESOURCE_SYMBOLS_SET,
  TronResourceSymbol,
} from '../constants/multichain/assets';
import { TEN_SECONDS_IN_MILLISECONDS } from './transactions-controller-utils';

const TOKEN_API_V3_BASE_URL = 'https://tokens.api.cx.metamask.io/v3';
const STATIC_METAMASK_BASE_URL = 'https://static.cx.metamask.io';

export const toAssetId = (
  address: Hex | CaipAssetType | string,
  chainId?: CaipChainId | Hex,
): CaipAssetType | undefined => {
  let addressToUse = address;
  let chainIdToUse = isStrictHexString(chainId)
    ? toEvmCaipChainId(chainId)
    : chainId;

  // Use chainId and address from caip assetId if provided
  if (isCaipAssetType(address)) {
    const { assetReference, chainId: chainIdFromCaipAssetId } =
      parseCaipAssetType(address);
    addressToUse = assetReference;
    chainIdToUse = chainIdFromCaipAssetId;
  }
  if (!chainIdToUse) {
    return undefined;
  }

  if (isNativeAddress(addressToUse)) {
    return getNativeAssetForChainId(chainIdToUse)?.assetId;
  }
  if (chainIdToUse === MultichainNetworks.SOLANA) {
    return CaipAssetTypeStruct.create(`${chainIdToUse}/token:${addressToUse}`);
  }
  if (chainIdToUse === MultichainNetworks.TRON) {
    return CaipAssetTypeStruct.create(`${chainIdToUse}/trc20:${addressToUse}`);
  }
  // EVM assets
  const checksummedAddress = toChecksumHexAddress(addressToUse) ?? addressToUse;
  if (isStrictHexString(checksummedAddress)) {
    return CaipAssetTypeStruct.create(
      `${chainIdToUse}/erc20:${checksummedAddress}`,
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
  const assetIdInCaip = toAssetId(assetId, chainId);
  if (!assetIdInCaip) {
    return undefined;
  }
  const normalizedAssetId = (
    isNonEvmChainId(chainId) ? assetIdInCaip : assetIdInCaip.toLowerCase()
  ).replaceAll(':', '/');

  return `${STATIC_METAMASK_BASE_URL}/api/v2/tokenIcons/assets/${
    normalizedAssetId
  }.png`;
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
    const assetId = toAssetId(address, chainId);

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
      image: getAssetImageUrl(assetId, chainId),
      assetId,
    };

    if (isNonEvmChainId(chainId) && assetId) {
      const { assetReference } = parseCaipAssetType(assetId);
      return {
        ...commonFields,
        address: assetReference,
        assetId,
        chainId,
      };
    }

    const hexChainId = isStrictHexString(chainId)
      ? chainId
      : decimalToPrefixedHex(parseCaipChainId(chainId).reference);
    return {
      ...commonFields,
      address: address.toLowerCase(),
      chainId: hexChainId,
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

/**
 * Checks if the given chain ID is an EVM chain ID
 *
 * @param chainId - The chain ID to check. It can be in caip or hex format.
 * @returns `true` if the chain ID is an EVM chain ID, `false` otherwise.
 */
export const isEvmChainId = (chainId: CaipChainId | Hex) => {
  const chainIdInCaip = isCaipChainId(chainId)
    ? chainId
    : toEvmCaipChainId(chainId);

  // TODO Replace with isEvmCaipChainId from @metamask/multichain-network-controller when it is exported
  const { namespace } = parseCaipChainId(chainIdInCaip);
  return namespace === KnownCaipNamespace.Eip155;
};

/**
 * Checks if the given assetId is a Tron resource
 *
 * @param asset - The assetId to check.
 * @returns `true` if the assetId is a Tron resource, `false` otherwise.
 */
export const isTronResource = (asset: Asset): boolean => {
  if (!isCaipAssetType(asset.assetId)) {
    return false;
  }
  const { chain } = parseCaipAssetType(asset.assetId);

  if (chain.namespace !== KnownCaipNamespace.Tron) {
    return false;
  }

  return TRON_RESOURCE_SYMBOLS_SET.has(
    asset.symbol?.toLowerCase() as TronResourceSymbol,
  );
};
