import { createSelector } from 'reselect';
import type { Hex } from '@metamask/utils';
import {
  getNetworkConfigurationsByChainId,
  type NetworkConfigurationsByChainIdState,
} from './networks';

// Routed through `getNetworkConfigurationsByChainId` (rather than reading
// `state` directly) so jest mocks of that selector flow through to consumers
// of these selectors.
export const selectNetworkConfigurationByChainId = createSelector(
  [
    (state: NetworkConfigurationsByChainIdState) =>
      getNetworkConfigurationsByChainId(state),
    (_state: NetworkConfigurationsByChainIdState, chainId: string) => chainId,
  ],
  (networkConfigurationsByChainId, chainId) =>
    networkConfigurationsByChainId[chainId as Hex],
);

export const selectDefaultRpcEndpointByChainId = createSelector(
  selectNetworkConfigurationByChainId,
  (networkConfiguration) => {
    if (!networkConfiguration) {
      return undefined;
    }
    const { defaultRpcEndpointIndex, rpcEndpoints } = networkConfiguration;
    return rpcEndpoints[defaultRpcEndpointIndex];
  },
);
