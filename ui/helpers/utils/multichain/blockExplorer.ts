import { KnownCaipNamespace, parseCaipChainId } from '@metamask/utils';
import { getAccountLink } from '@metamask/etherscan-link';
import type { MultichainNetwork } from '../../../selectors/multichain/networks';
import { normalizeSafeAddress } from '../../../../shared/lib/multichain/address';
import { MultichainProviderConfig } from '../../../../shared/constants/multichain/networks';
import {
  formatBlockExplorerAddressUrl,
  formatBlockExplorerAssetUrl,
} from '../../../../shared/lib/multichain/networks';

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
  if (blockExplorerFormatUrls) {
    // For Stellar and other networks with asset support, use asset URL format
    const assetUrl = formatBlockExplorerAssetUrl(
      blockExplorerFormatUrls,
      address,
    );
    if (assetUrl) {
      return assetUrl;
    }
    // Fallback to address format for networks without asset support
    return formatBlockExplorerAddressUrl(blockExplorerFormatUrls, address);
  }

  return '';
};
