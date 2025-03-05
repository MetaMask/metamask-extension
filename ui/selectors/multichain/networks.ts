import {
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  toEvmCaipChainId,
  toMultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { type NetworkConfiguration as InternalNetworkConfiguration } from '@metamask/network-controller';
import { BtcScope, SolScope } from '@metamask/keyring-api';
import { type CaipChainId, type Hex } from '@metamask/utils';

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
    if (isBitcoinEnabled && isSolanaEnabled) {
      return { bitcoinEnabled: true, solanaEnabled: true };
    }

    let bitcoinEnabled = isBitcoinEnabled;
    let solanaEnabled = isSolanaEnabled;

    // The scopes have been set to optional because the first time
    // they're used we can't guarantee that the scopes will be set
    // during the keyring migration execution.
    for (const { scopes } of internalAccounts) {
      if (scopes?.includes(BtcScope.Mainnet)) {
        bitcoinEnabled = true;
      }
      if (scopes?.includes(SolScope.Mainnet)) {
        solanaEnabled = true;
      }
      if (bitcoinEnabled && solanaEnabled) {
        break;
      }
    }

    return { bitcoinEnabled, solanaEnabled };
  },
);

export const getMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    getIsNonEvmNetworksEnabled,
    getNonEvmMultichainNetworkConfigurationsByChainId,
    ///: END:ONLY_INCLUDE_IF
    getNetworkConfigurationsByChainId,
    (
      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      isNonEvmNetworksEnabled,
      nonEvmNetworkConfigurationsByChainId,
      ///: END:ONLY_INCLUDE_IF
      networkConfigurationsByChainId,
    ): [
      Record<CaipChainId, InternalMultichainNetworkConfiguration>,
      Record<Hex, InternalNetworkConfiguration>,
    ] => {
      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
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
      ///: END:ONLY_INCLUDE_IF

      // There's a fallback for EVM network names/nicknames, in case the network
      // does not have a name/nickname the fallback is the first rpc endpoint url.
      // TODO: Update toMultichainNetworkConfigurationsByChainId to handle this case.
      const evmNetworks = Object.entries(networkConfigurationsByChainId).reduce(
        (acc, [, network]) => ({
          ...acc,
          [toEvmCaipChainId(network.chainId)]: {
            ...toMultichainNetworkConfiguration(network),
            name:
              network.name ||
              network.rpcEndpoints[network.defaultRpcEndpointIndex].url,
          },
        }),
        {},
      );

      const networks = {
        ///: BEGIN:ONLY_INCLUDE_IF(multichain)
        ...filteredNonEvmNetworkConfigurationsByChainId,
        ///: END:ONLY_INCLUDE_IF
        ...evmNetworks,
      };

      return [networks, networkConfigurationsByChainId];
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
  const [networkConfigurationsByChainId] =
    getMultichainNetworkConfigurationsByChainId(state);
  return networkConfigurationsByChainId[chainId];
};
