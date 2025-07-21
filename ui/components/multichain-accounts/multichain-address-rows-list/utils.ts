import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import { convertCaipToHexChainId } from '../../../../shared/modules/network.utils';
import {
  CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
  TEST_NETWORK_IDS,
} from '../../../../shared/constants/network';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';

export type NetworkAddressItem = {
  chainId: string;
  networkName: string;
  address: string;
};

/**
 * Gets priority score for sorting networks (lower = higher priority)
 */
const getNetworkPriority = (chainId: string): number => {
  if (chainId === CHAIN_IDS.MAINNET) return 0; // Ethereum first
  if (chainId === MultichainNetworks.SOLANA) return 1; // Solana second
  if (TEST_NETWORK_IDS.includes(chainId as typeof TEST_NETWORK_IDS[number])) return 4; // Test networks last
  if (FEATURED_NETWORK_CHAIN_IDS.includes(chainId as typeof FEATURED_NETWORK_CHAIN_IDS[number])) return 2; // Featured networks
  return 3; // Other custom networks
};

/**
 * Sorts network address items according to priority:
 * 1. Ethereum first, 2. Solana second, 3. Featured networks, 4. Other custom networks, 5. Test networks last
 */
export const sortNetworkAddressItems = (items: NetworkAddressItem[]): NetworkAddressItem[] => {
  return items.sort((a, b) => {
    const priorityDiff = getNetworkPriority(a.chainId) - getNetworkPriority(b.chainId);
    return priorityDiff !== 0 ? priorityDiff : a.networkName.localeCompare(b.networkName);
  });
};

/**
 * Converts CAIP chain ID to appropriate format (hex for EVM, CAIP for others)
 */
const formatChainId = (chainId: string): string => {
  return chainId.startsWith('eip155:') ? convertCaipToHexChainId(chainId as CaipChainId) : chainId;
};

/**
 * Creates a NetworkAddressItem from chain ID, network config, and address
 */
const createNetworkAddressItem = (
  chainId: string,
  network: { name: string; chainId: string },
  address: string,
): NetworkAddressItem => ({
  chainId: formatChainId(chainId),
  networkName: network.name,
  address,
});

/**
 * Gets compatible networks for an InternalAccount based on its scopes
 */
export const getCompatibleNetworksForAccount = (
  account: InternalAccount,
  allNetworks: Record<string, { name: string; chainId: string }>,
): NetworkAddressItem[] => {
  if (!account.scopes?.length) return [];

  const compatibleItems: NetworkAddressItem[] = [];

  account.scopes.forEach((scope: CaipChainId) => {
    if (scope.includes(':*') || scope.endsWith(':0')) {
      // Wildcard scope - add all networks for this namespace
      const namespace = scope.split(':')[0];
      Object.entries(allNetworks).forEach(([chainId, network]) => {
        if (chainId.split(':')[0] === namespace) {
          compatibleItems.push(createNetworkAddressItem(chainId, network, account.address));
        }
      });
    } else {
      // Specific network scope
      const network = allNetworks[scope];
      if (network) {
        compatibleItems.push(createNetworkAddressItem(scope, network, account.address));
      }
    }
  });

  return compatibleItems;
};
