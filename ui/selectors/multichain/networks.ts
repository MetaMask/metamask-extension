import {
  type MultichainNetworkControllerState as InternalMultichainNetworkState,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  toEvmCaipChainId,
  toMultichainNetworkConfiguration,
  ActiveNetworksByAddress,
} from '@metamask/multichain-network-controller';
import {
  NetworkStatus,
  type NetworkConfiguration as InternalNetworkConfiguration,
} from '@metamask/network-controller';
import { BtcScope, SolScope } from '@metamask/keyring-api';
import {
  type CaipChainId,
  type Hex,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';

import { createSelector } from 'reselect';
import {
  type ProviderConfigState,
  type SelectedNetworkClientIdState,
  getProviderConfig,
  getNetworkConfigurationsByChainId,
  MultichainNetworkConfigurationsByChainIdState,
  selectDefaultNetworkClientIdsByChainId,
  getNetworksMetadata,
} from '../../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import {
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsSolanaTestnetSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
} from '../selectors';
import { getInternalAccounts } from '../accounts';
import { getEnabledNetworks } from '../../../shared/modules/selectors/multichain';

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
      if (bitcoinEnabled && solanaEnabled) {
        break;
      }
    }

    return { bitcoinEnabled, solanaEnabled };
  },
);

export const getNonEvmMultichainNetworkConfigurationsByChainId =
  createDeepEqualSelector(
    (state: MultichainNetworkConfigurationsByChainIdState) =>
      state.metamask.multichainNetworkConfigurationsByChainId,
    getIsNonEvmNetworksEnabled,
    getIsSolanaTestnetSupportEnabled,
    getIsBitcoinTestnetSupportEnabled,
    (
      multichainNetworkConfigurationsByChainId,
      isNonEvmNetworksEnabled,
      isSolanaTestnetSupportEnabled,
      isBitcoinTestnetSupportEnabled,
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
          multichainNetworkConfigurationsByChainId[BtcScope.Mainnet];
      }

      if (bitcoinEnabled && isBitcoinTestnetSupportEnabled) {
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
        filteredNonEvmNetworkConfigurationsByChainId[SolScope.Devnet] =
          multichainNetworkConfigurationsByChainId[SolScope.Devnet];
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

export const getAllEnabledNetworksForAllNamespaces = createDeepEqualSelector(
  getEnabledNetworks,
  (enabledNetworkMap) => {
    return Object.values(enabledNetworkMap)
      .flatMap((namespaceNetworks) => Object.keys(namespaceNetworks))
      .filter((chainId) => chainId); // Filter out any empty strings
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

export const selectAnyEnabledNetworksAreAvailable = createSelector(
  getEnabledNetworks,
  selectDefaultNetworkClientIdsByChainId,
  getNetworksMetadata,
  (allEnabledNetworks, defaultNetworkClientIdsByChainId, networksMetadata) => {
    return Object.entries(allEnabledNetworks).reduce<boolean>(
      (result, [namespace, enabledNetworksByChainId]) => {
        if (namespace === KnownCaipNamespace.Eip155) {
          const chainIds = Object.entries(enabledNetworksByChainId)
            .filter(([_chainId, isEnabled]) => isEnabled)
            .map(([chainId, _isEnabled]) => chainId) as Hex[];
          const networkClientIds = chainIds.map(
            (chainId) => defaultNetworkClientIdsByChainId[chainId],
          );
          return (
            // If only non-EVM networks are enabled, then we may still
            // have an entry for EIP-155 but it will be empty
            networkClientIds.length === 0 ||
            networkClientIds.some(
              (networkClientId) =>
                networksMetadata[networkClientId]?.status ===
                NetworkStatus.Available,
            )
          );
        }
        // Assume that all non-EVM networks are available
        return result;
      },
      true,
    );
  },
);

export const selectFirstUnavailableEvmNetwork = createSelector(
  getEnabledNetworks,
  getNetworkConfigurationsByChainId,
  getNetworksMetadata,
  (enabledNetworks, networkConfigurationsByChainId, networksMetadata) => {
    // Get all enabled EVM networks
    const enabledEvmNetworks = enabledNetworks[KnownCaipNamespace.Eip155] ?? {};
    const enabledChainIds = Object.entries(enabledEvmNetworks)
      .filter(([, isEnabled]) => isEnabled)
      .map(([chainId]) => chainId as Hex);

    // Find the first network that is not available
    for (const chainId of enabledChainIds) {
      const networkConfiguration = networkConfigurationsByChainId[chainId];
      if (networkConfiguration) {
        // Get the network client ID directly from the network configuration
        const { rpcEndpoints, defaultRpcEndpointIndex, name } =
          networkConfiguration;
        const rpcEndpoint = rpcEndpoints[defaultRpcEndpointIndex];

        if (rpcEndpoint) {
          const status = networksMetadata[rpcEndpoint.networkClientId]?.status;
          if (status !== NetworkStatus.Available) {
            return {
              networkName: name,
              networkClientId: rpcEndpoint.networkClientId,
              chainId,
            };
          }
        }
      }
    }
    return null;
  },
);
