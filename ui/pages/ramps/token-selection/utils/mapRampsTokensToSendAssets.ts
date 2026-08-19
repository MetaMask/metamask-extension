import { type RampsToken } from '@metamask/ramps-controller';
import { type CaipChainId, type Hex } from '@metamask/utils';
import {
  AssetStandard,
  type AssetType,
} from '../../../../components/app/asset-picker';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../shared/constants/bridge';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../../../../../shared/constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../../../../../shared/constants/multichain/networks';
import { getAssetImageUrl } from '../../../../../shared/lib/asset-utils';
import { convertCaipToHexChainId } from '../../../../../shared/lib/network.utils';

export function getRampsNetworkDetailsForCaipChainId(
  caipChainId: CaipChainId,
  configuredName?: string,
): { networkName: string; networkImage: string } {
  const shortName =
    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      caipChainId as keyof typeof NETWORK_TO_SHORT_NETWORK_NAME_MAP
    ];

  const networkName = shortName || configuredName?.trim() || caipChainId;

  const bridgeImage =
    BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[
      caipChainId as keyof typeof BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP
    ];

  let networkImage =
    bridgeImage || MULTICHAIN_TOKEN_IMAGE_MAP[caipChainId] || '';

  if (!networkImage && caipChainId.startsWith('eip155:')) {
    try {
      const hexChainId = convertCaipToHexChainId(caipChainId);
      networkImage = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[hexChainId] || '';
    } catch {
      networkImage = '';
    }
  }

  return { networkName, networkImage };
}

export function filterRampsTokensByEnabledNetworks(
  tokens: RampsToken[] | undefined,
  networksByCaipChainId: Record<string, unknown>,
): RampsToken[] {
  if (!tokens) {
    return [];
  }

  return tokens.filter(
    (token) =>
      Boolean(token.chainId) &&
      networksByCaipChainId[token.chainId as CaipChainId] !== undefined,
  );
}

function parseAddressFromAssetId(assetId: string): string | undefined {
  const [, assetReference] = assetId.split('/');
  if (!assetReference) {
    return undefined;
  }

  if (assetReference.startsWith('erc20:')) {
    return assetReference.slice('erc20:'.length);
  }

  return undefined;
}

function normalizeSendAssetChainId(chainId: string): string {
  if (chainId.startsWith('eip155:')) {
    try {
      return convertCaipToHexChainId(chainId as CaipChainId);
    } catch {
      return chainId;
    }
  }

  return chainId;
}

function resolveRampsTokenImage(
  token: RampsToken,
  isNative: boolean,
  hexChainId: string,
): string {
  const staticAssetImageUrl =
    getAssetImageUrl(token.assetId, token.chainId as CaipChainId) ?? '';

  if (isNative) {
    return (
      CHAIN_ID_TOKEN_IMAGE_MAP[
        hexChainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ] ??
      CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[hexChainId as Hex] ??
      token.iconUrl ??
      staticAssetImageUrl
    );
  }

  return token.iconUrl || staticAssetImageUrl;
}

export function mapRampsTokenToSendAsset(
  token: RampsToken,
  networkDetails: { networkName: string; networkImage: string },
): AssetType {
  const isNative = token.assetId.includes('/slip44:');
  const chainId = normalizeSendAssetChainId(token.chainId);

  return {
    assetId: token.assetId,
    address: parseAddressFromAssetId(token.assetId),
    chainId,
    name: token.name,
    symbol: token.symbol,
    decimals: token.decimals,
    image: resolveRampsTokenImage(token, isNative, chainId),
    networkName: networkDetails.networkName,
    networkImage: networkDetails.networkImage,
    isNative,
    disabled: !token.tokenSupported,
    standard: isNative ? AssetStandard.Native : AssetStandard.ERC20,
  };
}

export function mapRampsTokensToSendAssets(
  tokens: RampsToken[],
  networksByCaipChainId: Record<string, { name?: string }>,
): AssetType[] {
  return tokens.map((token) => {
    const configuredName =
      networksByCaipChainId[token.chainId as CaipChainId]?.name;
    const networkDetails = getRampsNetworkDetailsForCaipChainId(
      token.chainId as CaipChainId,
      configuredName,
    );

    return mapRampsTokenToSendAsset(token, networkDetails);
  });
}
