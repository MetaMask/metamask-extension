import { CaipNamespace } from '@metamask/utils';

type EnabledNetworksByChainId = Record<CaipNamespace, Record<string, boolean>>;

const EMPTY_ENABLED_NETWORKS: EnabledNetworksByChainId = {};

/**
 *
 * @param state - Root state.
 * @param state.metamask - MetaMask state.
 * @param state.metamask.enabledNetworkMap - The map of enabled networks.
 * @returns The map of enabled networks.
 */
export const getEnabledNetworks = (state: {
  metamask: {
    enabledNetworkMap: EnabledNetworksByChainId;
  };
}) => state.metamask.enabledNetworkMap ?? EMPTY_ENABLED_NETWORKS;
