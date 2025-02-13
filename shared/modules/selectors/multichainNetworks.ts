import {
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  toMultichainNetworkConfigurationsByChainId,
} from '@metamask/multichain-network-controller';
import {
  type NetworkConfiguration as InternalNetworkConfiguration,
} from '@metamask/network-controller';
import { getNetworkConfigurationsByChainId } from './networks';

import { createDeepEqualSelector } from './util';

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

export type MultichainNetworkConfigState = MultichainNetworkConfigurationsByChainIdState & SelectedNetworkChainIdState;

// Selectors

export const getNonEvmMultichainNetworkConfigurationsByChainId = (state: MultichainNetworkConfigurationsByChainIdState) => state.metamask.multichainNetworkConfigurationsByChainId;

export const getMultichainNetworkConfigurationsByChainId = createDeepEqualSelector(
  getNonEvmMultichainNetworkConfigurationsByChainId,
  getNetworkConfigurationsByChainId,
  (nonEvmNetworkConfigurationsByChainId, networkConfigurationsByChainId) => {
    const networks = {
      ...nonEvmNetworkConfigurationsByChainId,
      ...toMultichainNetworkConfigurationsByChainId(networkConfigurationsByChainId),
    };

    console.log({ networks, nonEvmNetworkConfigurationsByChainId });
    return networks;
  }
);

export const getSelectedMultichainNetworkChainId = (state: SelectedNetworkChainIdState) => state.metamask.selectedMultichainNetworkChainId;

export const getSelectedMultichainNetworkConfiguration = (
  state: MultichainNetworkConfigState,
) => {
  const chainId = getSelectedMultichainNetworkChainId(state);
  const networkConfigurationsByChainId = getMultichainNetworkConfigurationsByChainId(state);
  return networkConfigurationsByChainId[chainId];
}
