/**
 * Network configuration types
 */
export interface NetworkTestConfig {
  id: string;
  networkName: string;
  networkNameLong?: string;
  tab?: string; // 'Popular' or custom tab name
  symbol: string;
  chainId?: number;
  chainIdHex: string;
  rpcUrl?: string;
  rpcName?: string;
  sendAmount: string;
  fixtureSetupMethod: string;
  description: string;
  requiresManualSetup?: boolean;
}

export interface NetworkConfigFile {
  additionalNetworks: NetworkTestConfig[];
  popularNetworks: NetworkTestConfig[];
  customNetworks: NetworkTestConfig[];
}

const NETWORK_CONFIGS: NetworkConfigFile = {
  additionalNetworks: [
    {
      id: 'monad',
      networkName: 'Monad',
      tab: 'Popular',
      symbol: 'MON',
      chainIdHex: '0x8f',
      sendAmount: '2',
      fixtureSetupMethod: 'withNetworkControllerOnMonad',
      description: 'Monad - Additional Network',
    },
    {
      id: 'Sei',
      networkName: 'Sei',
      tab: 'Popular',
      symbol: 'SEI',
      chainIdHex: '0x531',
      sendAmount: '2',
      fixtureSetupMethod: 'withNetworkControllerOnSei',
      description: 'Sei - Additional Network',
    },
  ],
  popularNetworks: [
    {
      id: 'base',
      networkName: 'Base',
      tab: 'Popular',
      symbol: 'ETH',
      chainIdHex: '0x2105',
      sendAmount: '0.00001',
      fixtureSetupMethod: 'withNetworkControllerOnBase',
      description: 'Base - Popular Network',
    },
    {
      id: 'Arbitrum',
      networkName: 'Arbitrum',
      tab: 'Popular',
      symbol: 'ETH',
      chainIdHex: '0xa4b1',
      sendAmount: '0.0000001',
      fixtureSetupMethod: 'withNetworkControllerOnArbitrum',
      description: 'Arbitrum - Popular Network',
    },
  ],
  customNetworks: [
    {
      id: 'chiliz',
      networkName: 'Chiliz',
      networkNameLong: 'Chiliz Chain',
      symbol: 'CHZ',
      chainId: 88888,
      chainIdHex: '0x15b38',
      rpcUrl: 'https://rpc.ankr.com/chiliz',
      rpcName: 'Chiliz RPC',
      sendAmount: '2',
      fixtureSetupMethod: 'withNetworkControllerOnMainnet',
      description: 'Chiliz - Custom Network',
      requiresManualSetup: true,
    },
    {
      id: 'etherlink',
      networkName: 'Etherlink',
      networkNameLong: 'Etherlink',
      symbol: 'XTZ',
      chainId: 42793,
      chainIdHex: '0xa729',
      rpcUrl: 'https://node.mainnet.etherlink.com',
      rpcName: 'Etherlink RPC',
      sendAmount: '0.002',
      fixtureSetupMethod: 'withNetworkControllerOnMainnet',
      description: 'Etherlink - Custom Network',
      requiresManualSetup: true,
    },
    {
      id: 'bob',
      networkName: 'BOB',
      networkNameLong: 'BOB',
      symbol: 'ETH',
      chainId: 60808,
      chainIdHex: '0xed88',
      rpcUrl: 'https://rpc.gobob.xyz',
      rpcName: 'BOB RPC',
      sendAmount: '0.00000002',
      fixtureSetupMethod: 'withNetworkControllerOnMainnet',
      description: 'BOB - Custom Network',
      requiresManualSetup: true,
    },
    {
      id: 'injective',
      networkName: 'Injective',
      networkNameLong: 'Injective',
      symbol: 'INJ',
      chainId: 1776,
      chainIdHex: '0x6f0',
      rpcUrl: 'https://sentry.evm-rpc.injective.network',
      rpcName: 'Injective RPC',
      sendAmount: '0.00000002',
      fixtureSetupMethod: 'withNetworkControllerOnMainnet',
      description: 'Injective - Custom Network',
      requiresManualSetup: true,
    },
  ],
};

/**
 * Load network test configurations from this configuration file
 * @param configPath - Deprecated, kept for API compatibility
 * @returns Parsed network configuration
 */
export function loadNetworkConfigs(
  _configPath?: string,
): NetworkConfigFile {
  return NETWORK_CONFIGS;
}

/**
 * Get all additional networks for parameterized testing
 * @param excludeIds - Optional list of network IDs to exclude
 * @returns Array of NetworkTestConfig for testing
 */
export function getAdditionalNetworksForTesting(
  excludeIds?: string[],
): NetworkTestConfig[] {
  const config = loadNetworkConfigs();
  if (excludeIds && excludeIds.length > 0) {
    return config.additionalNetworks.filter(
      (net) => !excludeIds.includes(net.id),
    );
  }
  return config.additionalNetworks;
}

/**
 * Get all popular networks for parameterized testing
 * @param excludeIds - Optional list of network IDs to exclude
 * @returns Array of NetworkTestConfig for testing
 */
export function getPopularNetworksForTesting(
  excludeIds?: string[],
): NetworkTestConfig[] {
  const config = loadNetworkConfigs();
  if (excludeIds && excludeIds.length > 0) {
    return config.popularNetworks.filter(
      (net) => !excludeIds.includes(net.id),
    );
  }
  return config.popularNetworks;
}

/**
 * Get all custom networks for parameterized testing
 * @param excludeIds - Optional list of network IDs to exclude
 * @returns Array of custom NetworkTestConfig for testing
 */
export function getCustomNetworksForTesting(
  excludeIds?: string[],
): NetworkTestConfig[] {
  const config = loadNetworkConfigs();
  if (excludeIds && excludeIds.length > 0) {
    return config.customNetworks.filter(
      (net) => !excludeIds.includes(net.id),
    );
  }
  return config.customNetworks;
}

/**
 * Get a specific network configuration by ID
 * @param networkId - The network ID to find
 * @returns The network configuration or undefined
 */
export function getNetworkConfigById(
  networkId: string,
): NetworkTestConfig | undefined {
  const config = loadNetworkConfigs();
  const network =
    config.additionalNetworks.find((net) => net.id === networkId) ||
    config.popularNetworks.find((net) => net.id === networkId) ||
    config.customNetworks.find((net) => net.id === networkId);
  return network;
}

/**
 * Get network configuration by network name
 * @param networkName - The network name to find
 * @returns The network configuration or undefined
 */
export function getNetworkConfigByName(
  networkName: string,
): NetworkTestConfig | undefined {
  const config = loadNetworkConfigs();
  const network =
    config.additionalNetworks.find((net) => net.networkName === networkName) ||
    config.popularNetworks.find((net) => net.networkName === networkName) ||
    config.customNetworks.find((net) => net.networkName === networkName);
  return network;
}

/**
 * Validate that all required fields are present in network config
 * @param network - The network configuration to validate
 * @returns true if valid, false otherwise
 */
export function isValidNetworkConfig(network: NetworkTestConfig): boolean {
  const requiredFields = [
    'id',
    'networkName',
    'symbol',
    'chainIdHex',
    'sendAmount',
    'fixtureSetupMethod',
    'description',
  ];
  return requiredFields.every((field) => (network as any)[field] !== undefined && (network as any)[field] !== '');
}
