import { NetworkConfiguration } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';

/**
 * Safely decode a URI component, returning the original string if decoding fails.
 *
 * @param str - The string to decode
 * @returns The decoded string, or the original string if decoding fails or input is invalid
 */
export function safeDecodeURIComponent(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') {
    return '';
  }

  try {
    return decodeURIComponent(str);
  } catch (error) {
    // If decoding fails (e.g., malformed URI), return the original string
    return str;
  }
}

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

/**
 * Formats the origin for display by removing the protocol.
 *
 * @param origin - The origin string (can be encoded or decoded).
 * @param isEncoded - Whether the origin is encoded or decoded.
 * @returns The origin without the protocol prefix.
 */
export const getDisplayOrigin = (origin: string, isEncoded = true): string => {
  const decoded = isEncoded ? safeDecodeURIComponent(origin) : origin;
  return decoded.replace(/^https?:\/\//u, '');
};
