import {
  RpcEndpointType,
  type NetworkConfiguration,
  type NetworkState as _NetworkState,
} from '@metamask/network-controller';
import { createSelector } from 'reselect';
import { NetworkStatus } from '../../shared/constants/network';
import { createDeepEqualSelector } from './util';

export type NetworkState = { metamask: _NetworkState };

export type NetworkConfigurationsState = {
  metamask: {
    networkConfigurations: Record<
      string,
      MetaMaskExtensionNetworkConfiguration
    >;
  };
};

export type SelectedNetworkClientIdState = {
  metamask: {
    selectedNetworkClientId: string;
  };
};

export type MetaMaskExtensionNetworkConfiguration = NetworkConfiguration;

export type NetworkConfigurationsByChainIdState = {
  metamask: Pick<_NetworkState, 'networkConfigurationsByChainId'>;
};

export type ProviderConfigState = NetworkConfigurationsByChainIdState &
  SelectedNetworkClientIdState;

export const getNetworkConfigurationsByChainId = createDeepEqualSelector(
  (state: NetworkConfigurationsByChainIdState) =>
    state.metamask.networkConfigurationsByChainId,
  (networkConfigurationsByChainId) => networkConfigurationsByChainId,
);

export function getSelectedNetworkClientId(
  state: SelectedNetworkClientIdState,
) {
  return state.metamask.selectedNetworkClientId;
}

/**
 * Get the provider configuration for the current selected network.
 *
 * @param state - Redux state object.
 */
export const getProviderConfig = createSelector(
  (state: ProviderConfigState) => getNetworkConfigurationsByChainId(state),
  getSelectedNetworkClientId,
  (networkConfigurationsByChainId, selectedNetworkClientId) => {
    for (const network of Object.values(networkConfigurationsByChainId)) {
      for (const rpcEndpoint of network.rpcEndpoints) {
        if (rpcEndpoint.networkClientId === selectedNetworkClientId) {
          const blockExplorerUrl =
            network.defaultBlockExplorerUrlIndex === undefined
              ? undefined
              : network.blockExplorerUrls?.[
                  network.defaultBlockExplorerUrlIndex
                ];

          return {
            chainId: network.chainId,
            ticker: network.nativeCurrency,
            rpcPrefs: { ...(blockExplorerUrl && { blockExplorerUrl }) },
            type:
              rpcEndpoint.type === RpcEndpointType.Custom
                ? 'rpc'
                : rpcEndpoint.networkClientId,
            ...(rpcEndpoint.type === RpcEndpointType.Custom && {
              id: rpcEndpoint.networkClientId,
              nickname: network.name,
              rpcUrl: rpcEndpoint.url,
            }),
          };
        }
      }
    }
    return undefined; // should not be reachable
  },
);

export function getNetworkConfigurations(
  state: NetworkConfigurationsState,
): Record<string, MetaMaskExtensionNetworkConfiguration> {
  return state.metamask.networkConfigurations;
}

/**
 * Returns true if the currently selected network is inaccessible or whether no
 * provider has been set yet for the currently selected network.
 *
 * @param state - Redux state object.
 */
export function isNetworkLoading(state: NetworkState) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    selectedNetworkClientId &&
    state.metamask.networksMetadata[selectedNetworkClientId].status !==
      NetworkStatus.Available
  );
}

export function getInfuraBlocked(state: NetworkState) {
  return (
    state.metamask.networksMetadata[getSelectedNetworkClientId(state)]
      .status === NetworkStatus.Blocked
  );
}
