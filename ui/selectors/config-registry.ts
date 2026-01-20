import { createSelector } from 'reselect';
import type {
  ConfigRegistryState as ConfigRegistryControllerState,
  NetworkConfig,
} from '@metamask/config-registry-controller';

export type ConfigRegistryState = {
  metamask: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ConfigRegistryController: ConfigRegistryControllerState;
  };
};

/**
 * Gets the Config Registry controller state.
 *
 * @param state - The MetaMask state object
 * @returns The Config Registry controller state
 */
export const getConfigRegistryState = (
  state: ConfigRegistryState,
): ConfigRegistryControllerState => {
  const controllerState = state.metamask.ConfigRegistryController;

  return (
    controllerState ?? {
      configs: { networks: {} },
      version: null,
      lastFetched: null,
      fetchError: null,
      etag: null,
    }
  );
};

/**
 * Gets all network configurations from Config Registry.
 * Networks are stored in configs.networks with chainId as key.
 *
 * @param state - The MetaMask state object
 * @returns Array of NetworkConfig from the config registry
 */
export const getConfigRegistryNetworks = createSelector(
  [getConfigRegistryState],
  (configState): NetworkConfig[] => {
    const { configs } = configState;
    const networks = configs?.networks || {};
    if (!networks || Object.keys(networks).length === 0) {
      return [];
    }

    const result = Object.values(networks)
      .map((entry) => {
        const network = entry.value;
        if (network && typeof network === 'object' && 'chainId' in network) {
          return network as NetworkConfig;
        }
        return null;
      })
      .filter((network): network is NetworkConfig => network !== null);

    return result;
  },
);

/**
 * Checks if Config Registry networks are loading.
 *
 * @param state - The MetaMask state object
 * @returns True if networks are being fetched or haven't been fetched yet
 */
export const isConfigRegistryNetworksLoading = createSelector(
  [getConfigRegistryState],
  (configState) => {
    const hasFetched = configState.lastFetched !== null;
    const networks = configState.configs?.networks || {};
    const hasConfigs = Object.keys(networks).length > 0;

    if (hasConfigs) {
      return false;
    }

    return !hasFetched && !hasConfigs;
  },
);

/**
 * Gets the fetch error from Config Registry if any.
 *
 * @param state - The MetaMask state object
 * @returns Error message or null
 */
export const getConfigRegistryError = createSelector(
  [getConfigRegistryState],
  (configState) => configState.fetchError,
);
