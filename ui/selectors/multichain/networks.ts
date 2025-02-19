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
import { getInternalAccounts } from '../accounts';

// Selector types

export type MultichainNetworkControllerState = {
  metamask: InternalMultichainNetworkState;
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

export const getIsNonEvmNetworksEnabled = createDeepEqualSelector(
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getInternalAccounts,
  (isBitcoinEnabled, isSolanaEnabled, internalAccounts) => {
    let bitcoinEnabled = isBitcoinEnabled;
    let solanaEnabled = isSolanaEnabled;

    // We still check if any non-EVM accounts exists for those networks, in
    // case any of the `is*Enabled` is wrongly disabled while we still have
    // valid accounts.
    for (const { scopes } of internalAccounts) {
      // No need to iterate further if both are enabled.
      if (bitcoinEnabled && solanaEnabled) {
        break;
      }
      
      if (scopes.includes(BtcScope.Mainnet)) {
        bitcoinEnabled = true;
      }
      if (scopes.includes(SolScope.Mainnet)) {
        solanaEnabled = true;
      }
    }

    return { bitcoinEnabled, solanaEnabled };
  },
);

export const getMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    getNonEvmMultichainNetworkConfigurationsByChainId,
    getNetworkConfigurationsByChainId,
    getIsNonEvmNetworksEnabled,
    (
      nonEvmNetworkConfigurationsByChainId,
      networkConfigurationsByChainId,
      isNonEvmNetworksEnabled,
    ): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
      const filteredNonEvmNetworkConfigurationsByChainId: Record<
        CaipChainId,
        InternalMultichainNetworkConfiguration
      > = {};

      // This is not ideal but since there are only two non EVM networks
      // we can just filter them out based on the support enabled
      const { bitcoinEnabled, solanaEnabled } = isNonEvmNetworksEnabled;
      if (bitcoinEnabled) {
        filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Mainnet] =
          nonEvmNetworkConfigurationsByChainId[BtcScope.Mainnet];
      }

      if (solanaEnabled) {
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

export const getIsEvmMultichainNetworkSelected = (state: IsEvmSelectedState) =>
  state.metamask.isEvmSelected;

export const getSelectedMultichainNetworkChainId = (
  state: MultichainNetworkConfigState,
) => {
  const isEvmSelected = getIsEvmMultichainNetworkSelected(state);

  if (isEvmSelected) {
    const evmNetworkConfig = getProviderConfig(state);
    return toEvmCaipChainId(evmNetworkConfig.chainId);
  }
  return state.metamask.selectedMultichainNetworkChainId;
};

export const getSelectedMultichainNetworkConfiguration = (
  state: MultichainNetworkConfigState,
) => {
  const chainId = getSelectedMultichainNetworkChainId(state);
  const networkConfigurationsByChainId =
    getMultichainNetworkConfigurationsByChainId(state);
  return networkConfigurationsByChainId[chainId];
};
