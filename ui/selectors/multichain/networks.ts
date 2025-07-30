import { BtcScope, SolScope, TrxScope } from '@metamask/keyring-api';
import {
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  ActiveNetworksByAddress,
  toEvmCaipChainId,
  toMultichainNetworkConfiguration,
} from '@metamask/multichain-network-controller';
import { type NetworkConfiguration as InternalNetworkConfiguration } from '@metamask/network-controller';
import { type CaipChainId, type Hex, parseCaipChainId } from '@metamask/utils';

import {
  type ProviderConfigState,
  type SelectedNetworkClientIdState,
  getNetworkConfigurationsByChainId,
  getProviderConfig,
  MultichainNetworkConfigurationsByChainIdState,
} from '../../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getInternalAccounts } from '../accounts';
import {
  getEnabledNetworks,
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsSolanaTestnetSupportEnabled,
  getIsTronSupportEnabled,
} from '../selectors';

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

export type NetworksWithTransactionActivityByAccountsState = {
  metamask: {
    networksWithTransactionActivity: ActiveNetworksByAddress;
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
    ProviderConfigState &
    NetworksWithTransactionActivityByAccountsState;

// Selectors

export const getIsNonEvmNetworksEnabled = createDeepEqualSelector(
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsTronSupportEnabled,
  getInternalAccounts,
  (isBitcoinEnabled, isSolanaEnabled, isTronEnabled, internalAccounts) => {
    if (isBitcoinEnabled && isSolanaEnabled && isTronEnabled) {
      return { bitcoinEnabled: true, solanaEnabled: true, tronEnabled: true };
    }

    let bitcoinEnabled = isBitcoinEnabled;
    let solanaEnabled = isSolanaEnabled;
    let tronEnabled = isTronEnabled;

    // The scopes have been set to optional because the first time
    // they're used we can't guarantee that the scopes will be set
    // during the keyring migration execution.
    for (const { scopes } of internalAccounts) {
      if (
        scopes?.includes(
          BtcScope.Mainnet || BtcScope.Testnet || BtcScope.Signet,
        )
      ) {
        bitcoinEnabled = true;
      }
      if (scopes?.includes(SolScope.Mainnet)) {
        solanaEnabled = true;
      }
      if (
        scopes?.includes(TrxScope.Mainnet || TrxScope.Nile || TrxScope.Shasta)
      ) {
        tronEnabled = true;
      }
      if (bitcoinEnabled && solanaEnabled && tronEnabled) {
        break;
      }
    }

    return { bitcoinEnabled, solanaEnabled, tronEnabled };
  },
);

export const getNonEvmMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    (state: MultichainNetworkConfigurationsByChainIdState) =>
      state.metamask.multichainNetworkConfigurationsByChainId,
    getIsNonEvmNetworksEnabled,
    (state) => getIsSolanaTestnetSupportEnabled(state),
    (
      multichainNetworkConfigurationsByChainId,
      isNonEvmNetworksEnabled,
      isSolanaTestnetSupportEnabled,
    ): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
      const filteredNonEvmNetworkConfigurationsByChainId: Record<
        CaipChainId,
        InternalMultichainNetworkConfiguration
      > = {};
      // This is not ideal but since there are only two non EVM networks
      // we can just filter them out based on the support enabled
      const { bitcoinEnabled, solanaEnabled, tronEnabled } = isNonEvmNetworksEnabled;
      if (bitcoinEnabled) {
        filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Mainnet] =
          multichainNetworkConfigurationsByChainId[BtcScope.Mainnet];
        filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Testnet] =
          multichainNetworkConfigurationsByChainId[BtcScope.Testnet];
        filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Signet] =
          multichainNetworkConfigurationsByChainId[BtcScope.Signet];
      }

      if (solanaEnabled) {
        filteredNonEvmNetworkConfigurationsByChainId[SolScope.Mainnet] =
          multichainNetworkConfigurationsByChainId[SolScope.Mainnet];
      }

      if (solanaEnabled && isSolanaTestnetSupportEnabled) {
        // TODO: Uncomment this when we want to support testnet
        // filteredNonEvmNetworkConfigurationsByChainId[SolScope.Testnet] =
        //   multichainNetworkConfigurationsByChainId[SolScope.Testnet];
        filteredNonEvmNetworkConfigurationsByChainId[SolScope.Devnet] =
          multichainNetworkConfigurationsByChainId[SolScope.Devnet];
      }

      if (tronEnabled) {
        filteredNonEvmNetworkConfigurationsByChainId[TrxScope.Mainnet] =
          multichainNetworkConfigurationsByChainId[TrxScope.Mainnet];
        filteredNonEvmNetworkConfigurationsByChainId[TrxScope.Nile] =
          multichainNetworkConfigurationsByChainId[TrxScope.Nile];
        filteredNonEvmNetworkConfigurationsByChainId[TrxScope.Shasta] =
          multichainNetworkConfigurationsByChainId[TrxScope.Shasta];
      }

      return filteredNonEvmNetworkConfigurationsByChainId;
    },
  );

export const getMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    ///: BEGIN:ONLY_INCLUDE_IF(multichain)
    getNonEvmMultichainNetworkConfigurationsByChainId,
    ///: END:ONLY_INCLUDE_IF
    getNetworkConfigurationsByChainId,
    (
      ///: BEGIN:ONLY_INCLUDE_IF(multichain)
      nonEvmNetworkConfigurationsByChainId,
      ///: END:ONLY_INCLUDE_IF
      networkConfigurationsByChainId,
    ): [
      Record<CaipChainId, InternalMultichainNetworkConfiguration>,
      Record<Hex, InternalNetworkConfiguration>,
    ] => {
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
        ...nonEvmNetworkConfigurationsByChainId,
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

export const getNetworksWithActivity = (state: MultichainNetworkConfigState) =>
  state.metamask.networksWithTransactionActivity;

export const getNetworksWithTransactionActivity = createDeepEqualSelector(
  getNetworksWithActivity,
  (networksWithActivity) => networksWithActivity,
);

export const getEnabledNetworksByNamespace = createDeepEqualSelector(
  getEnabledNetworks,
  getSelectedMultichainNetworkChainId,
  (enabledNetworkMap, currentMultichainChainId) => {
    const { namespace } = parseCaipChainId(currentMultichainChainId);
    return enabledNetworkMap[namespace] ?? {};
  },
);

export const getEnabledChainIds = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getEnabledNetworks,
  getSelectedMultichainNetworkChainId,
  (networkConfigurations, enabledNetworks, currentMultichainChainId) => {
    const { namespace } = parseCaipChainId(currentMultichainChainId);
    // Get enabled networks for the current namespace
    const networksForNamespace = enabledNetworks[namespace] || {};

    return Object.keys(networkConfigurations).filter(
      (chainId) => networksForNamespace[chainId],
    );
  },
);

export const getEnabledNetworkClientIds = createDeepEqualSelector(
  getNetworkConfigurationsByChainId,
  getEnabledNetworks,
  getSelectedMultichainNetworkChainId,
  (networkConfigurations, enabledNetworks, currentMultichainChainId) => {
    const { namespace } = parseCaipChainId(currentMultichainChainId);

    // Get enabled networks for the current namespace
    const networksForNamespace = enabledNetworks[namespace as string] || {};

    return Object.entries(networkConfigurations).reduce(
      (acc, [chainId, network]) => {
        if (networksForNamespace[chainId]) {
          acc.push(
            network.rpcEndpoints[network.defaultRpcEndpointIndex]
              .networkClientId,
          );
        }
        return acc;
      },
      [] as string[],
    );
  },
);
