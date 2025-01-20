import {
  RpcEndpointType,
  type NetworkConfiguration,
  type NetworkState as InternalNetworkState,
} from '@metamask/network-controller';
import { createSelector } from 'reselect';
import { NetworkStatus } from '../../constants/network';
// import type { MultichainNetworkControllerState as InternalMultichainNetworkControllerState } from '../../../app/scripts/controllers/multichain-network-controller/MultichainNetworkController';
import { createDeepEqualSelector } from './util';

export type NetworkState = {
  metamask: InternalNetworkState;
};

export type NetworkConfigurationsState = {
  metamask: {
    networkConfigurations: Record<string, NetworkConfiguration>;
  };
};

export type SelectedNetworkClientIdState = {
  metamask: Pick<InternalNetworkState, 'selectedNetworkClientId'>;
};

export type NetworkConfigurationsByChainIdState = {
  metamask: Pick<InternalNetworkState, 'networkConfigurationsByChainId'>;
};

export type NetworksMetadataState = {
  metamask: Pick<InternalNetworkState, 'networksMetadata'>;
};

export type ProviderConfigState = NetworkConfigurationsByChainIdState &
  SelectedNetworkClientIdState;

export const getNetworkConfigurationsByChainId = createDeepEqualSelector(
  (state: NetworkConfigurationsByChainIdState) => {
    return {
      ...state.metamask.networkConfigurationsByChainId,
      // @ts-expect-error - TS is not recognizing the type of the networkConfigurationsByChainId property
      ...state.metamask.multichainNetworkConfigurationsByChainId,
    };
  },
  (networkConfigurationsByChainId) => networkConfigurationsByChainId,
);

export function getSelectedNetworkClientId(state: any, isEvm?: boolean) {
  if (isEvm || !state.metamask.nonEvmSelected) {
    console.log(
      'getSelectedNetworkClientId selector (EVM):',
      state.metamask.selectedNetworkClientId,
    );
    return state.metamask.selectedNetworkClientId;
  }
  console.log(
    'getSelectedNetworkClientId selector (non-EVM):',
    state.metamask.multichainSelectedNetworkChainId,
  );
  return state.metamask.multichainSelectedNetworkChainId;
}

/**
 * Get the provider configuration for the current selected network.
 *
 * @param state - Redux state object.
 * @throws `new Error('Provider configuration not found')` If the provider configuration is not found.
 */
export const getProviderConfig = createSelector(
  (state: ProviderConfigState) => getNetworkConfigurationsByChainId(state),
  getSelectedNetworkClientId,
  (networkConfigurationsByChainId, selectedNetworkClientId) => {
    console.log(
      'networkConfigurationsByChainId',
      networkConfigurationsByChainId,
    );
    if (selectedNetworkClientId === 'bip122:000000000019d6689c085ae165831e93') {
      return {
        chainId: selectedNetworkClientId,
        ticker: 'BTC',
        rpcPrefs: {},
        type: undefined,
        id: selectedNetworkClientId,
        nickname: 'Bitcoin Mainnet',
        rpcUrl: undefined,
      };
    }

    if (selectedNetworkClientId === 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp') {
      return {
        chainId: selectedNetworkClientId,
        ticker: 'SOL',
        rpcPrefs: {},
        type: undefined,
        id: selectedNetworkClientId,
        nickname: 'Solana Mainnet',
        rpcUrl: undefined,
      };
    }

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

export function getNetworkConfigurations(
  state: NetworkConfigurationsState,
): Record<string, NetworkConfiguration> {
  return state.metamask.networkConfigurations;
}

/**
 * Returns true if the currently selected network is inaccessible or whether no
 * provider has been set yet for the currently selected network.
 *
 * @param state - Redux state object.
 */
export function isNetworkLoading(state: any) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  console.log(
    'isNetworkLoading selector:',
    state.metamask.networksMetadata,
    selectedNetworkClientId,
  );
  if (state.metamask.nonEvmSelected) {
    return false;
  }

  return (
    selectedNetworkClientId &&
    state.metamask.networksMetadata[selectedNetworkClientId].status !==
      NetworkStatus.Available
  );
}

export function getInfuraBlocked(state: any) {
  console.log('getInfuraBlocked selector:', state.metamask.networksMetadata);

  if (state.metamask.nonEvmSelected) {
    return false;
  }

  return (
    state.metamask.networksMetadata[getSelectedNetworkClientId(state)]
      .status === NetworkStatus.Blocked
  );
}

export function getCurrentChainId(state: ProviderConfigState) {
  const { chainId } = getProviderConfig(state);
  return chainId;
}

export function getNetworkForAccount(state: any, account?)
