import { NetworkConfiguration } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';

/**
 * Extracts the network name from the network configuration.
 *
 * @param networks - The network configurations.
 * @param chainId - The chain ID.
 * @param isFullNetworkName - Whether to return the full network name or not.
 * @returns The network name.
 */
export const extractNetworkName = (
  networks: Record<`0x${string}`, NetworkConfiguration>,
  chainId: Hex,
  isFullNetworkName = false,
) => {
  const network = networks[chainId];
  if (network?.name && network?.name.trim() !== '') {
    return isFullNetworkName
      ? network.name
      : `networkName${network.name.trim().split(' ')[0]}`;
  }
  return 'unknownNetworkForGatorPermissions';
};
