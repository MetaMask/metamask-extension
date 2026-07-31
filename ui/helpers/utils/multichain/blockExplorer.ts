import { getAccountLink, getTokenTrackerLink } from '@metamask/etherscan-link';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipAssetType,
  KnownCaipNamespace,
  parseCaipAssetType,
  parseCaipChainId,
} from '@metamask/utils';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainProviderConfig,
} from '../../../../shared/constants/multichain/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import {
  formatBlockExplorerAddressUrl,
  formatBlockExplorerAssetUrl,
  type MultichainBlockExplorerFormatUrls,
} from '../../../../shared/lib/multichain/networks';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import type { MultichainNetwork } from '../../../selectors/multichain/networks';

export type BlockExplorerLink = {
  url: string;
  name: string;
};

export type GetFungibleAssetBlockExplorerLinkOptions = {
  caipChainId?: CaipChainId;
  tokenAddress?: string;
  isNative: boolean;
  evmNetworkConfigurations: Record<Hex, NetworkConfiguration>;
  multichainNetworkConfigurations: Record<
    CaipChainId,
    MultichainNetworkConfiguration
  >;
  fallbackExplorerLabel: string;
  walletAddress?: string;
};

const resolveContractAddress = (tokenAddress?: string): string | undefined => {
  if (!tokenAddress) {
    return undefined;
  }

  if (isCaipAssetType(tokenAddress)) {
    return parseCaipAssetType(tokenAddress as CaipAssetType).assetReference;
  }

  return tokenAddress;
};

const getNonEvmAssetBlockExplorerUrl = (
  formatUrls: MultichainBlockExplorerFormatUrls | undefined,
  contractAddress: string,
): string | null => {
  if (!formatUrls) {
    return null;
  }

  const url = formatUrls.asset
    ? formatBlockExplorerAssetUrl(formatUrls, contractAddress)
    : formatBlockExplorerAddressUrl(formatUrls, contractAddress);

  return url || null;
};

export const getFungibleAssetBlockExplorerLink = ({
  caipChainId,
  tokenAddress,
  isNative,
  evmNetworkConfigurations,
  multichainNetworkConfigurations,
  fallbackExplorerLabel,
  walletAddress = '',
}: GetFungibleAssetBlockExplorerLinkOptions): BlockExplorerLink | null => {
  const contractAddress = resolveContractAddress(tokenAddress);

  if (!contractAddress || isNative || !caipChainId) {
    return null;
  }

  const multichainNetworkConfig = multichainNetworkConfigurations[caipChainId];

  if (isEvmChainId(caipChainId)) {
    const evmHexChainId = convertCaipToHexChainId(caipChainId);
    const evmNetworkConfig = evmNetworkConfigurations[evmHexChainId];
    const defaultIdx = evmNetworkConfig?.defaultBlockExplorerUrlIndex;
    const blockExplorerUrl =
      defaultIdx === undefined
        ? ''
        : (evmNetworkConfig?.blockExplorerUrls?.[defaultIdx] ?? '');

    return {
      url: getTokenTrackerLink(
        contractAddress,
        evmHexChainId,
        '',
        walletAddress,
        {
          blockExplorerUrl,
        },
      ),
      name:
        multichainNetworkConfig?.name ??
        evmNetworkConfig?.name ??
        fallbackExplorerLabel,
    };
  }

  const formatUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
  const url = getNonEvmAssetBlockExplorerUrl(formatUrls, contractAddress);

  if (!url) {
    return null;
  }

  return {
    url,
    name: formatUrls?.name ?? multichainNetworkConfig?.name ?? 'Block Explorer',
  };
};

export const getMultichainBlockExplorerUrl = (
  network: MultichainNetwork,
): string => {
  return network.network?.rpcPrefs?.blockExplorerUrl ?? '';
};

export const getMultichainAccountUrl = (
  address: string,
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    const normalizedAddress = normalizeSafeAddress(address);
    return `https://etherscan.io/address/${normalizedAddress}#asset-multichain`;
  }

  // We're in a non-EVM context, so we assume we can use format URLs instead.
  const { blockExplorerFormatUrls } =
    network.network as MultichainProviderConfig;
  if (blockExplorerFormatUrls) {
    return formatBlockExplorerAddressUrl(blockExplorerFormatUrls, address);
  }

  return '';
};

export const getAssetDetailsAccountUrl = (
  address: string,
  network: MultichainNetwork,
): string => {
  const { namespace } = parseCaipChainId(network.chainId);
  if (namespace === KnownCaipNamespace.Eip155) {
    return getAccountLink(
      normalizeSafeAddress(address),
      network.network.chainId,
      network.network?.rpcPrefs,
    );
  }

  const { blockExplorerFormatUrls } =
    network.network as MultichainProviderConfig;

  return getNonEvmAssetBlockExplorerUrl(blockExplorerFormatUrls, address) ?? '';
};
