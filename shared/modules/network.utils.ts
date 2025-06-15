import {
  type Hex,
  type CaipChainId,
  KnownCaipNamespace,
  isStrictHexString,
  parseCaipChainId,
  add0x,
} from '@metamask/utils';
import { convertHexToDecimal } from '@metamask/controller-utils';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import type { NetworkConfiguration } from '@metamask/network-controller';

import {
  CHAIN_IDS,
  MAX_SAFE_CHAIN_ID,
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
} from '../constants/network';
import { MULTICHAIN_TOKEN_IMAGE_MAP } from '../constants/multichain/networks';

type RpcEndpoint = {
  name?: string;
  url: string;
  networkClientId: string;
};

/**
 * Checks whether the given number primitive chain ID is safe.
 * Because some cryptographic libraries we use expect the chain ID to be a
 * number primitive, it must not exceed a certain size.
 *
 * @param chainId - The chain ID to check for safety.
 * @returns Whether the given chain ID is safe.
 */
export function isSafeChainId(chainId: unknown): boolean {
  return isSafeInteger(chainId) && chainId > 0 && chainId <= MAX_SAFE_CHAIN_ID;
}

/**
 * Checks whether the given value is a 0x-prefixed, non-zero, non-zero-padded,
 * hexadecimal string.
 *
 * @param value - The value to check.
 * @returns True if the value is a correctly formatted hex string,
 * false otherwise.
 */
export function isPrefixedFormattedHexString(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }
  return /^0x[1-9a-f]+[0-9a-f]*$/iu.test(value);
}

/**
 * Check if token detection is enabled for certain networks
 *
 * @param chainId - ChainID of network
 * @returns Whether the current network supports token detection
 */
export function isTokenDetectionEnabledForNetwork(chainId: string | undefined) {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
    case CHAIN_IDS.BSC:
    case CHAIN_IDS.POLYGON:
    case CHAIN_IDS.AVALANCHE:
    case CHAIN_IDS.LINEA_GOERLI:
    case CHAIN_IDS.LINEA_SEPOLIA:
    case CHAIN_IDS.LINEA_MAINNET:
    case CHAIN_IDS.ARBITRUM:
    case CHAIN_IDS.OPTIMISM:
    case CHAIN_IDS.BASE:
    case CHAIN_IDS.ZKSYNC_ERA:
    case CHAIN_IDS.CRONOS:
    case CHAIN_IDS.CELO:
    case CHAIN_IDS.GNOSIS:
    case CHAIN_IDS.FANTOM:
    case CHAIN_IDS.POLYGON_ZKEVM:
    case CHAIN_IDS.MOONBEAM:
    case CHAIN_IDS.MOONRIVER:
      return true;
    default:
      return false;
  }
}

/**
 * Like {@link Number.isSafeInteger}, but types the input as a `number` if it is
 * indeed a safe integer.
 *
 * @param value - The value to check.
 * @returns True if the value is a safe integer, false otherwise.
 */
function isSafeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value);
}

/**
 * TODO: Delete when ready to remove `networkVersion` from provider object
 * Convert the given value into a valid network ID. The ID is accepted
 * as either a number, a decimal string, or a 0x-prefixed hex string.
 *
 * @param value - The network ID to convert, in an unknown format.
 * @returns A valid network ID (as a decimal string) or null if
 * the given value cannot be parsed.
 */
export function convertNetworkId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return `${value}`;
  } else if (isStrictHexString(value)) {
    return `${convertHexToDecimal(value)}`;
  } else if (typeof value === 'string' && /^\d+$/u.test(value)) {
    return value;
  }
  return null;
}

/**
 * Convert an eip155 CAIP chain ID to a hex chain ID.
 *
 * @param id - The CAIP chain ID to convert.
 * @returns The hex chain ID.
 */
export function convertCaipToHexChainId(id: CaipChainId): Hex {
  const { namespace, reference } = parseCaipChainId(id);
  if (namespace === KnownCaipNamespace.Eip155) {
    return add0x(parseInt(reference, 10).toString(16));
  }

  throw new Error(
    `Unsupported CAIP chain ID namespace: ${namespace}. Only eip155 is supported.`,
  );
}

/**
 * Sorts a list of networks based on the order of their chain IDs.
 *
 * @param networks - The networks to sort.
 * @param sortedChainIds - The chain IDs to sort by.
 * @returns The sorted list of networks.
 */
export const sortNetworks = (
  networks: Record<string, MultichainNetworkConfiguration>,
  sortedChainIds: { networkId: string }[],
): MultichainNetworkConfiguration[] =>
  Object.values(networks).sort((a, b) => {
    const indexA = sortedChainIds.findIndex(
      ({ networkId }) => networkId === a.chainId,
    );
    const indexB = sortedChainIds.findIndex(
      ({ networkId }) => networkId === b.chainId,
    );

    // If the chainId is not found, assign Infinity to place it at the bottom
    const adjustedIndexA = indexA === -1 ? Infinity : indexA;
    const adjustedIndexB = indexB === -1 ? Infinity : indexB;

    return adjustedIndexA - adjustedIndexB;
  });

/**
 * Get the network icon for the given chain ID.
 *
 * @param networkConfiguration - The network configuration to get the icon for.
 * @returns The URL of the network icon.
 */
export const getNetworkIcon = (
  networkConfiguration: MultichainNetworkConfiguration,
) => {
  return networkConfiguration.isEvm
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        convertCaipToHexChainId(networkConfiguration.chainId)
      ]
    : MULTICHAIN_TOKEN_IMAGE_MAP[networkConfiguration.chainId];
};

/**
 * Get the RPC data for the given chain ID.
 *
 * @param chainId - The chain ID to get the RPC data for.
 * @param evmNetworks - The network configurations for EVM networks.
 * @returns The RPC data for the chain ID.
 */
export const getRpcDataByChainId = (
  chainId: CaipChainId,
  evmNetworks: Record<Hex, NetworkConfiguration>,
): {
  rpcEndpoints: RpcEndpoint[];
  defaultRpcEndpoint: RpcEndpoint;
} => {
  const hexChainId = convertCaipToHexChainId(chainId);

  if (!evmNetworks[hexChainId]) {
    throw new Error(
      `Network configuration not found for chain ID: ${chainId} (${hexChainId})`,
    );
  }

  const evmNetworkConfig = evmNetworks[hexChainId];
  const { rpcEndpoints, defaultRpcEndpointIndex } = evmNetworkConfig;
  const defaultRpcEndpoint = rpcEndpoints[defaultRpcEndpointIndex];
  return {
    rpcEndpoints,
    defaultRpcEndpoint,
  };
};

/**
 * Sorts a list of test networks based on the predefined priority.
 * And then sorts the rest of the networks in alphabetical order.
 *
 * @param networks - The networks to sort.
 * @param priorityList - The list of CAIP Chain IDs to prioritize.
 * @returns The sorted list of networks.
 */
export const sortNetworksByPrioity = (
  networks: MultichainNetworkConfiguration[],
  priorityList: CaipChainId[],
) => {
  return networks.sort((networkA, networkB) => {
    const indexA = priorityList.indexOf(networkA.chainId);
    const indexB = priorityList.indexOf(networkB.chainId);

    if (indexA !== -1 && indexB !== -1) {
      // if both are in the priority list, networkA will go first then networkB
      return indexA - indexB;
    } else if (indexA !== -1) {
      // if networkA in the priority list and the networkB not in the list, networkA will go first
      return -1;
    } else if (indexB !== -1) {
      // if networkB in the priority list and the networkA not in the list, networkB will go first
      return 1;
    }
    // if both are not in the priority list, sort by name
    return networkA.name.localeCompare(networkB.name);
  });
};
