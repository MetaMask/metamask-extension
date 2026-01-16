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
      configs: {},
      version: null,
      lastFetched: null,
      fetchError: null,
      etag: null,
    }
  );
};

/**
 * Gets all network configurations from Config Registry.
 * Networks are stored in configs with chainId as key.
 *
 * @param state - The MetaMask state object
 * @returns Array of NetworkConfig from the config registry
 */
export const getConfigRegistryNetworks = createSelector(
  [getConfigRegistryState],
  (configState): NetworkConfig[] => {
    const { configs } = configState;
    if (!configs || Object.keys(configs).length === 0) {
      return [];
    }

    // Networks are stored in configs with chainId as key
    // Each entry has: { key: chainId, value: NetworkConfig, metadata?: {...} }
    return Object.values(configs)
      .map((entry) => {
        // The value should be the NetworkConfig object
        const network = entry.value;
        if (network && typeof network === 'object' && 'chainId' in network) {
          return network as NetworkConfig;
        }
        return null;
      })
      .filter((network): network is NetworkConfig => network !== null);
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
    // Consider loading if:
    // 1. No configs yet AND no lastFetched timestamp (initial state)
    // 2. There's a fetch error (might be retrying)
    // If we have lastFetched, we've successfully fetched (even if empty)
    const hasFetched = configState.lastFetched !== null;
    const hasConfigs =
      configState.configs && Object.keys(configState.configs).length > 0;

    // If we have configs (even without lastFetched), we're not loading
    // This handles the case where persisted configs exist but lastFetched wasn't saved
    if (hasConfigs) {
      return false;
    }

    // Only consider loading if we've never fetched AND have no configs
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
