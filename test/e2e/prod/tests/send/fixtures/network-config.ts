import * as fs from 'fs';
import * as path from 'path';

/**
 * Network configuration types
 */
export interface NetworkTestConfig {
  id: string;
  networkName: string;
  tab?: string; // 'Popular' or custom tab name
  symbol: string;
  chainIdHex: string;
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

/**
 * Load network test configurations from JSON file
 * @param configPath - Optional custom path to config file
 * @returns Parsed network configuration
 */
export function loadNetworkConfigs(
  configPath?: string,
): NetworkConfigFile {
  const defaultPath = path.join(
    __dirname,
    'all-networks.json',
  );
  const filePath = configPath || defaultPath;

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(fileContent) as NetworkConfigFile;
  } catch (error) {
    throw new Error(
      `Failed to load network configuration from ${filePath}: ${error}`,
    );
  }
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
