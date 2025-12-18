import { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipChainId } from '@metamask/utils';
import {
  CAIP_FORMATTED_EVM_TEST_CHAINS,
  CHAIN_IDS,
  FEATURED_NETWORK_CHAIN_IDS,
  TEST_NETWORK_IDS,
} from '../../../../shared/constants/network';
import {
  MultichainNetworks,
  SOLANA_TEST_CHAINS,
} from '../../../../shared/constants/multichain/networks';

export type NetworkAddressItem = {
  chainId: string;
  networkName: string;
  address: string;
};

/**
 * Gets priority score for sorting networks (lower = higher priority)
 *
 * @param chainId - CAIP chain ID
 * @returns Priority score
 */
const getNetworkPriority = (chainId: string): number => {
  if (chainId === CHAIN_IDS.MAINNET) {
    return 0;
  } // Ethereum first
  if (chainId === MultichainNetworks.SOLANA) {
    return 1;
  } // Solana second
  if (TEST_NETWORK_IDS.includes(chainId as (typeof TEST_NETWORK_IDS)[number])) {
    return 4;
  } // Test networks last
  if (
    FEATURED_NETWORK_CHAIN_IDS.includes(
      chainId as (typeof FEATURED_NETWORK_CHAIN_IDS)[number],
    )
  ) {
    return 2;
  } // Featured networks
  return 3; // Other custom networks
};

/**
 * Sorts network address items according to priority:
 * 1. Ethereum first, 2. Solana second, 3. Featured networks, 4. Other custom networks, 5. Test networks last
 *
 * @param items - Array of NetworkAddressItem objects to sort
 * @returns Sorted array of NetworkAddressItem objects
 */
export const sortNetworkAddressItems = (
  items: NetworkAddressItem[],
): NetworkAddressItem[] => {
  return items.sort((a, b) => {
    const priorityDiff =
      getNetworkPriority(a.chainId) - getNetworkPriority(b.chainId);
    return priorityDiff === 0
      ? a.networkName.localeCompare(b.networkName)
      : priorityDiff;
  });
};

/**
 * Creates a NetworkAddressItem from chain ID, network config, and address
 *
 * @param chainId - CAIP chain ID
 * @param network - Network configuration
 * @param network.name - Network name
 * @param network.chainId - Network chain ID
 * @param address - Address to associate with the network
 * @returns NetworkAddressItem object
 */
const createNetworkAddressItem = (
  chainId: CaipChainId,
  network: { name: string; chainId: CaipChainId },
  address: string,
): NetworkAddressItem => ({
  chainId,
  networkName: network.name,
  address,
});

/**
 * Gets compatible networks for an InternalAccount based on its scopes.
 * Filters out test networks to match mobile implementation behavior.
 *
 * @param account - InternalAccount object to get compatible networks for
 * @param allNetworks - Record of all network configurations
 * @returns Array of NetworkAddressItem objects, excluding test networks
 */
export const getCompatibleNetworksForAccount = (
  account: InternalAccount,
  allNetworks: Record<CaipChainId, { name: string; chainId: CaipChainId }>,
): NetworkAddressItem[] => {
  if (!account.scopes?.length) {
    return [];
  }

  const compatibleItems: NetworkAddressItem[] = [];

  account.scopes.forEach((scope: CaipChainId) => {
    if (scope.includes(':*') || scope.endsWith(':0')) {
      // Wildcard scope - add all networks for this namespace
      const namespace = scope.split(':')[0];
      Object.entries(allNetworks).forEach(([chainId, network]) => {
        if (chainId.split(':')[0] === namespace) {
          compatibleItems.push(
            createNetworkAddressItem(
              chainId as CaipChainId,
              network,
              account.address,
            ),
          );
        }
      });
    } else {
      // Specific network scope
      const network = allNetworks[scope];
      if (network) {
        compatibleItems.push(
          createNetworkAddressItem(scope, network, account.address),
        );
      }
    }
  });

  // Filter out test networks
  return compatibleItems.filter(
    (item) =>
      !CAIP_FORMATTED_EVM_TEST_CHAINS.includes(item.chainId) &&
      !SOLANA_TEST_CHAINS.includes(item.chainId as CaipChainId),
  );
};
