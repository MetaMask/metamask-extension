import {
  type NetworkConfiguration,
  type NetworkMetadata,
} from '@metamask/network-controller';
import { CaipChainId, Hex } from '@metamask/utils';
import {
  BUILT_IN_INFURA_NETWORKS,
  BuiltInInfuraNetwork,
  NETWORK_TYPES,
  NetworkStatus,
  type NetworkTypes,
} from '../../shared/constants/network';

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

export type NetworkState = NetworkConfigurationsState &
  SelectedNetworkClientIdState & {
    metamask: { networksMetadata: Record<string, NetworkMetadata> };
  };

export type MetaMaskExtensionNetworkConfiguration = Omit<
  NetworkConfiguration,
  'chainId' | 'rpcPrefs' | 'ticker' | 'rpcUrl'
> & {
  rpcUrl?: string;
  chainId: Hex | CaipChainId;
  id?: string;
  ticker: string;
  type?: NetworkTypes;
  rpcPrefs?: NetworkConfiguration['rpcPrefs'] & { imageUrl?: string };
};

/**
 * Get the provider configuration for the current selected network.
 *
 * @param state - Redux state object.
 */
export function getProviderConfig(
  state: NetworkState,
): MetaMaskExtensionNetworkConfiguration {
  const networkClientId = getSelectedNetworkClientId(state);
  const builtInNetwork =
    BUILT_IN_INFURA_NETWORKS[networkClientId as BuiltInInfuraNetwork];
  return builtInNetwork
    ? {
        ...builtInNetwork,
        type: networkClientId as BuiltInInfuraNetwork,
        rpcPrefs: { blockExplorerUrl: builtInNetwork.blockExplorerUrl },
      }
    : {
        ...getNetworkConfigurations(state)[networkClientId],
        type: NETWORK_TYPES.RPC,
      };
}

export function getSelectedNetworkClientId(
  state: SelectedNetworkClientIdState,
) {
  return state.metamask.selectedNetworkClientId;
}

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

export function getCurrentChainId(state: NetworkState) {
  const { chainId } = getProviderConfig(state);
  return chainId;
}
