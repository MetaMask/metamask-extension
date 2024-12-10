import { RpcEndpointType } from '@metamask/network-controller';
import { createSelector } from 'reselect';
import { NetworkStatus } from '../../constants/network';
import { BackgroundStateProxy } from '../../types/metamask';
import { createDeepEqualSelector } from './util';

export const getNetworkConfigurationsByChainId = createDeepEqualSelector(
  (state: { metamask: BackgroundStateProxy }) =>
    state.metamask.NetworkController.networkConfigurationsByChainId,
  (networkConfigurationsByChainId) => networkConfigurationsByChainId,
);

export function getSelectedNetworkClientId(state: {
  metamask: BackgroundStateProxy;
}) {
  return state.metamask.NetworkController.selectedNetworkClientId;
}

/**
 * Get the provider configuration for the current selected network.
 *
 * @param state - Redux state object.
 * @throws `new Error('Provider configuration not found')` If the provider configuration is not found.
 */
export const getProviderConfig = createSelector(
  (state: { metamask: BackgroundStateProxy }) =>
    getNetworkConfigurationsByChainId(state),
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
    throw new Error('Provider configuration not found');
  },
);

/**
 * Returns true if the currently selected network is inaccessible or whether no
 * provider has been set yet for the currently selected network.
 *
 * @param state - Redux state object.
 * @param state.metamask - `metamask` slice
 */
export function isNetworkLoading(state: { metamask: BackgroundStateProxy }) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    selectedNetworkClientId &&
    state.metamask.NetworkController.networksMetadata[selectedNetworkClientId]
      .status !== NetworkStatus.Available
  );
}

export function getInfuraBlocked(state: { metamask: BackgroundStateProxy }) {
  return (
    state.metamask.NetworkController.networksMetadata[
      getSelectedNetworkClientId(state)
    ].status === NetworkStatus.Blocked
  );
}

export function getCurrentChainId(state: { metamask: BackgroundStateProxy }) {
  const { chainId } = getProviderConfig(state);
  return chainId;
}
