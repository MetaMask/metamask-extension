import {
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  toMultichainNetworkConfigurationsByChainId,
} from '@metamask/multichain-network-controller';
import {
  type NetworkConfiguration as InternalNetworkConfiguration,
} from '@metamask/network-controller';
import { type CaipChainId } from '@metamask/keyring-api';

import { getNetworkConfigurationsByChainId } from '../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';

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
  (nonEvmNetworkConfigurationsByChainId, networkConfigurationsByChainId): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
    const networks = {
      ...nonEvmNetworkConfigurationsByChainId,
      ...toMultichainNetworkConfigurationsByChainId(networkConfigurationsByChainId),
    };

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
