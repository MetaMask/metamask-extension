import { NetworkClientId } from '@metamask/network-controller';
import { CaipNamespace, Hex, KnownCaipNamespace } from '@metamask/utils';
import type { NetworkConfigurationsByChainIdState } from './networks';

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

/**
 * Returns default network client IDs for every enabled EIP-155 network.
 *
 * @param enabledNetworkMap - Map of enabled networks by CAIP namespace.
 * @param networkConfigurationsByChainId - NetworkController configs by hex chain ID.
 * @returns Network client IDs for enabled EVM networks.
 */
export function getAllEnabledNetworkClientIds(
  enabledNetworkMap: EnabledNetworksByChainId | undefined,
  networkConfigurationsByChainId: NetworkConfigurationsByChainIdState['metamask']['networkConfigurationsByChainId'],
): NetworkClientId[] {
  const enabledEip155Networks =
    enabledNetworkMap?.[KnownCaipNamespace.Eip155] ?? {};

  const chainIds = Object.entries(enabledEip155Networks)
    .filter(([_chainId, isEnabled]) => isEnabled)
    .map(([chainId, _isEnabled]) => chainId) as Hex[];

  return chainIds.map((chainId) => {
    const networkConfiguration = networkConfigurationsByChainId[chainId];
    return networkConfiguration.rpcEndpoints[
      networkConfiguration.defaultRpcEndpointIndex
    ].networkClientId;
  });
}
