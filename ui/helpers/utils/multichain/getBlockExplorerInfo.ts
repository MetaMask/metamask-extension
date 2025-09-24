import { CaipChainId, KnownCaipNamespace } from '@metamask/utils';
import {
  CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP,
  CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP,
} from '../../../../shared/constants/common';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';

export type BlockExplorerInfo = {
  addressUrl: string;
  name: string;
  buttonText: string;
};

export type NetworkInfo = {
  chainId?: CaipChainId;
  blockExplorerUrl?: string;
  networkName: string;
};

/**
 * Gets block explorer information for a specific network
 *
 * @param t - Translation function
 * @param address - The address to create the URL for
 * @param networkInfo - Information about the network including chainId, blockExplorerUrl, and networkName
 * @returns BlockExplorerInfo or null if no explorer available
 */
export const getBlockExplorerInfo = (
  t: (key: string, ...args: string[]) => string,
  address: string,
  networkInfo: NetworkInfo,
): BlockExplorerInfo | null => {
  const { chainId, blockExplorerUrl } = networkInfo;

  // For multichain networks (Bitcoin, Solana), use CaipChainId for reliable detection
  if (chainId) {
    // Bitcoin networks
    if (
      chainId === MultichainNetworks.BITCOIN ||
      chainId === MultichainNetworks.BITCOIN_TESTNET ||
      chainId === MultichainNetworks.BITCOIN_SIGNET
    ) {
      const blockExplorerFormatUrls =
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[chainId];
      if (blockExplorerFormatUrls) {
        const explorerName = 'Blockstream';
        const addressUrl = formatBlockExplorerAddressUrl(
          blockExplorerFormatUrls,
          address,
        );
        return {
          addressUrl,
          name: explorerName,
          buttonText: t('viewAddressOnExplorer', explorerName),
        };
      }
    }

    // Solana networks
    if (
      chainId === MultichainNetworks.SOLANA ||
      chainId === MultichainNetworks.SOLANA_DEVNET ||
      chainId === MultichainNetworks.SOLANA_TESTNET
    ) {
      const blockExplorerFormatUrls =
        MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[chainId];
      if (blockExplorerFormatUrls) {
        const explorerName = 'Solscan';
        const addressUrl = formatBlockExplorerAddressUrl(
          blockExplorerFormatUrls,
          address,
        );
        return {
          addressUrl,
          name: explorerName,
          buttonText: t('viewAddressOnExplorer', explorerName),
        };
      }
    }
  }

  // For EVM networks, use CaipChainId for reliable detection
  if (chainId?.startsWith(KnownCaipNamespace.Eip155)) {
    // Convert CaipChainId to hex for EVM networks
    const hexChainId = `0x${parseInt(chainId.split(':')[1], 10).toString(16)}`;

    // Use the provided block explorer URL if available
    if (blockExplorerUrl) {
      const explorerName =
        CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP[hexChainId] ||
        'Block Explorer';
      const addressUrl = `${blockExplorerUrl}/address/${address}`;

      return {
        addressUrl,
        name: explorerName,
        buttonText: t('viewAddressOnExplorer', explorerName),
      };
    }

    // Use known EVM network mappings
    const explorerName =
      CHAINID_DEFAULT_BLOCK_EXPLORER_HUMAN_READABLE_URL_MAP[hexChainId];
    if (explorerName) {
      // Get the base URL from the mapping (remove trailing slash)
      const baseUrl = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[
        hexChainId
      ]?.replace(/\/$/u, '');
      if (baseUrl) {
        return {
          addressUrl: `${baseUrl}/address/${address}`,
          name: explorerName,
          buttonText: t('viewAddressOnExplorer', explorerName),
        };
      }
    }
  }

  return null;
};
