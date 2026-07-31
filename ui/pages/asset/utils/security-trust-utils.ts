import { getTokenTrackerLink } from '@metamask/etherscan-link';
import {
  type CaipAssetType,
  type CaipChainId,
  type Hex,
  isCaipChainId,
  isStrictHexString,
  parseCaipAssetType,
} from '@metamask/utils';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { NetworkConfiguration } from '@metamask/network-controller';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP } from '../../../../shared/constants/multichain/networks';
import { isEvmChainId } from '../../../../shared/lib/asset-utils';
import { convertCaipToHexChainId } from '../../../../shared/lib/network.utils';
import {
  formatBlockExplorerAddressUrl,
  formatBlockExplorerAssetUrl,
} from '../../../../shared/lib/multichain/networks';

/**
 * Normalize chain ids to CAIP-2 for Security & Trust analytics and routing.
 * @param chainId
 */
export const toSecurityTrustChainId = (
  chainId?: string,
): CaipChainId | undefined => {
  if (!chainId) {
    return undefined;
  }

  if (isCaipChainId(chainId)) {
    return chainId;
  }

  if (isEvmChainId(chainId)) {
    return toEvmCaipChainId(chainId as Hex);
  }

  return undefined;
};

export const getSecurityTrustTokenTypeLabel = (
  assetId: CaipAssetType | undefined,
  isNative: boolean,
): string => {
  if (isNative) {
    return 'Native';
  }

  if (!assetId) {
    return 'Token';
  }

  try {
    const { assetNamespace } = parseCaipAssetType(assetId);
    if (assetNamespace === 'erc20') {
      return 'ERC-20';
    }
    if (assetNamespace === 'spl') {
      return 'SPL';
    }
    return assetNamespace.toUpperCase();
  } catch {
    return 'Token';
  }
};

type SecurityTrustBlockExplorerLink = {
  url: string;
  name: string;
};

type GetSecurityTrustBlockExplorerLinkOptions = {
  caipChainId?: CaipChainId;
  tokenAddress?: string;
  isNative: boolean;
  evmNetworkConfigurations: Record<Hex, NetworkConfiguration>;
  multichainNetworkConfigurations: Record<
    CaipChainId,
    MultichainNetworkConfiguration
  >;
  fallbackExplorerLabel: string;
};

export const getSecurityTrustBlockExplorerLink = ({
  caipChainId,
  tokenAddress,
  isNative,
  evmNetworkConfigurations,
  multichainNetworkConfigurations,
  fallbackExplorerLabel,
}: GetSecurityTrustBlockExplorerLinkOptions): SecurityTrustBlockExplorerLink | null => {
  if (!tokenAddress || isNative || !caipChainId) {
    return null;
  }

  const contractAddress = isCaipChainId(tokenAddress)
    ? parseCaipAssetType(tokenAddress as CaipAssetType).assetReference
    : tokenAddress;

  const multichainNetworkConfig =
    multichainNetworkConfigurations[caipChainId];

  if (isEvmChainId(caipChainId)) {
    const evmHexChainId = convertCaipToHexChainId(caipChainId);
    const evmNetworkConfig = evmNetworkConfigurations[evmHexChainId];
    const defaultIdx = evmNetworkConfig?.defaultBlockExplorerUrlIndex;
    const blockExplorerUrl =
      defaultIdx === undefined
        ? ''
        : (evmNetworkConfig?.blockExplorerUrls?.[defaultIdx] ?? '');

    return {
      url: getTokenTrackerLink(contractAddress, evmHexChainId, '', '', {
        blockExplorerUrl,
      }),
      name:
        multichainNetworkConfig?.name ??
        evmNetworkConfig?.name ??
        fallbackExplorerLabel,
    };
  }

  const formatUrls =
    MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
  if (!formatUrls) {
    return null;
  }

  const url = formatUrls.asset
    ? formatBlockExplorerAssetUrl(formatUrls, contractAddress)
    : formatBlockExplorerAddressUrl(formatUrls, contractAddress);

  if (!url) {
    return null;
  }

  return {
    url,
    name: formatUrls.name ?? multichainNetworkConfig?.name ?? 'Block Explorer',
  };
};
