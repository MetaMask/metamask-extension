import {
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import {
  NetworkStatus,
  type NetworkState as InternalNetworkState,
  type NetworkConfiguration as InternalNetworkConfiguration,
} from '@metamask/network-controller';
import type { NetworkConfigurationsByChainIdState } from './networks';

import { createDeepEqualSelector } from './util';
import { hexToDecimal } from '../conversion.utils';


// Selector types

export type MultichainNetworkControllerState = {
  metamask: InternalMultichainNetworkState;
};

export type NetworkConfigurationsState = {
  metamask: {
    networkConfigurations: Record<string, InternalMultichainNetworkConfiguration>;
  };
};

export type SelectedNetworkChainIdState = {
  metamask: Pick<InternalMultichainNetworkState, 'selectedMultichainNetworkChainId'>;
};

export type MultichainNetworkConfigurationsByChainIdState = {
  metamask: {
    multichainNetworkConfigurationsByChainId: Record<string, InternalMultichainNetworkConfiguration>;
    networkConfigurationsByChainId: Record<string, InternalNetworkConfiguration>;
  };
};

export type NetworksMetadataState = {
  metamask: {
    multichainNetworksMetadata: Pick<InternalMultichainNetworkState, 'multichainNetworksMetadata'>,
    networksMetadata: Pick<InternalNetworkState, 'networksMetadata'>
  };
};

export type ProviderConfigState = MultichainNetworkConfigurationsByChainIdState & SelectedNetworkChainIdState;

// Selectors

export function getMultichainNetworkConfigurationsByChainId (state: MultichainNetworkConfigurationsByChainIdState) {
  return state.metamask.multichainNetworkConfigurationsByChainId
}

export function getSelectedMultichainNetworkChainId(
  state: SelectedNetworkChainIdState,
) {
  return state.metamask.selectedMultichainNetworkChainId;
}

export function getMultichainProviderConfig(
  state: ProviderConfigState,
) {
  const chainId = getSelectedMultichainNetworkChainId(state);
  const networkConfigurationsByChainId = getMultichainNetworkConfigurationsByChainId(state);
  return networkConfigurationsByChainId[chainId];
}

export function isNetworkLoading(state: MultichainNetworkControllerState) {
  const selectedNetworkChainId = getSelectedMultichainNetworkChainId(state);
  return (
    selectedNetworkChainId &&
    state.metamask.multichainNetworksMetadata[selectedNetworkChainId].status !==
      NetworkStatus.Available
  );
}
