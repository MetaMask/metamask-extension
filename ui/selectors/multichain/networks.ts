import {
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  toEvmCaipChainId,
  toMultichainNetworkConfigurationsByChainId,
} from '@metamask/multichain-network-controller';
import { type NetworkConfiguration as InternalNetworkConfiguration } from '@metamask/network-controller';
import { type CaipChainId, BtcScope, SolScope } from '@metamask/keyring-api';

import {
  type ProviderConfigState,
  type SelectedNetworkClientIdState,
  getProviderConfig,
  getNetworkConfigurationsByChainId,
} from '../../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
} from '../selectors';

// Selector types

export type MultichainNetworkControllerState = {
  metamask: InternalMultichainNetworkState;
};

export type NetworkConfigurationsState = {
  metamask: {
    networkConfigurations: Record<
      string,
      InternalMultichainNetworkConfiguration
    >;
  };
};

export type SelectedNetworkChainIdState = {
  metamask: Pick<
    InternalMultichainNetworkState,
    'selectedMultichainNetworkChainId'
  >;
};

export type IsEvmSelectedState = {
  metamask: Pick<InternalMultichainNetworkState, 'isEvmSelected'>;
};

export type MultichainNetworkConfigurationsByChainIdState = {
  metamask: {
    multichainNetworkConfigurationsByChainId: Record<
      string,
      InternalMultichainNetworkConfiguration
    >;
    networkConfigurationsByChainId: Record<
      string,
      InternalNetworkConfiguration
    >;
  };
};

/**
 * This type takes into account the state
 * of the multichain-network-controller and
 * the network-controller.
 */
export type MultichainNetworkConfigState =
  MultichainNetworkConfigurationsByChainIdState &
    SelectedNetworkChainIdState &
    IsEvmSelectedState &
    SelectedNetworkClientIdState &
    ProviderConfigState;

// Selectors

export const getNonEvmMultichainNetworkConfigurationsByChainId = (
  state: MultichainNetworkConfigurationsByChainIdState,
) => state.metamask.multichainNetworkConfigurationsByChainId;

export const getMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    getNonEvmMultichainNetworkConfigurationsByChainId,
    getNetworkConfigurationsByChainId,
    getIsBitcoinSupportEnabled,
    getIsSolanaSupportEnabled,
    (
      nonEvmNetworkConfigurationsByChainId,
      networkConfigurationsByChainId,
      isBitcoinSupportEnabled,
      isSolanaSupportEnabled,
    ): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
      const filteredNonEvmNetworkConfigurationsByChainId: Record<
        CaipChainId,
        InternalMultichainNetworkConfiguration
      > = {};

      // This is not ideal but since there are only two non EVM networks
      // we can just filter them out based on the support enabled
      if (isBitcoinSupportEnabled) {
        filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Mainnet] =
          nonEvmNetworkConfigurationsByChainId[BtcScope.Mainnet];
      }

      if (isSolanaSupportEnabled) {
        filteredNonEvmNetworkConfigurationsByChainId[SolScope.Mainnet] =
          nonEvmNetworkConfigurationsByChainId[SolScope.Mainnet];
      }

      const networks = {
        ...filteredNonEvmNetworkConfigurationsByChainId,
        ...toMultichainNetworkConfigurationsByChainId(
          networkConfigurationsByChainId,
        ),
      };

      return networks;
    },
  );

export const getIsEvmSelected = (state: IsEvmSelectedState) =>
  state.metamask.isEvmSelected;

export const getSelectedMultichainNetworkChainId = (
  state: SelectedNetworkChainIdState,
) => state.metamask.selectedMultichainNetworkChainId;

export const getSelectedMultichainNetworkConfiguration = (
  state: MultichainNetworkConfigState,
) => {
  let chainId: CaipChainId;
  const isEvmSelected = getIsEvmSelected(state);
  if (isEvmSelected) {
    const evmNetworkConfig = getProviderConfig(state);
    chainId = toEvmCaipChainId(evmNetworkConfig.chainId);
  } else {
    chainId = getSelectedMultichainNetworkChainId(state);
  }

  const networkConfigurationsByChainId =
    getMultichainNetworkConfigurationsByChainId(state);
  return networkConfigurationsByChainId[chainId];
};
