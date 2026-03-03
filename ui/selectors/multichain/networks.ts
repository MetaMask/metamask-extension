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
import {
  BtcScope,
  SolScope,
  TrxScope,
  isEvmAccountType,
} from '@metamask/keyring-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type { NetworkType } from '@metamask/controller-utils';
import {
  type CaipChainId,
  type Hex,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import { createSelector } from 'reselect';
import {
  MULTICHAIN_PROVIDER_CONFIGS,
  type MultichainProviderConfig,
} from '../../../shared/constants/multichain/networks';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  infuraProjectId,
} from '../../../shared/constants/network';
import {
  type ProviderConfigState,
  type SelectedNetworkClientIdState,
  getProviderConfig,
  getNetworkConfigurationsByChainId,
  getCurrentChainId,
  MultichainNetworkConfigurationsByChainIdState,
  selectDefaultNetworkClientIdsByChainId,
  getNetworksMetadata,
} from '../../../shared/modules/selectors/networks';
import { createDeepEqualSelector } from '../../../shared/modules/selectors/util';
import { getEnabledNetworks } from '../../../shared/modules/selectors/multichain';
import { getIsMetaMaskInfuraEndpointUrl } from '../../../shared/lib/network-utils';
import { type RemoteFeatureFlagsState } from '../remote-feature-flags';
import {
  getInternalAccounts,
  getSelectedInternalAccount,
  getMaybeSelectedInternalAccount,
  type AccountsState,
} from '../accounts';
import {
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsSolanaTestnetSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
  getIsTronSupportEnabled,
  getIsTronTestnetSupportEnabled,
} from './feature-flags';

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
    NetworksWithTransactionActivityByAccountsState &
    RemoteFeatureFlagsState &
    AccountsState;

// Selectors

export const getIsNonEvmNetworksEnabled = createSelector(
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
      if (scopes?.includes(TrxScope.Mainnet)) {
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
    getIsSolanaTestnetSupportEnabled,
    getIsBitcoinTestnetSupportEnabled,
    getIsTronTestnetSupportEnabled,
    (
      multichainNetworkConfigurationsByChainId,
      isNonEvmNetworksEnabled,
      isSolanaTestnetSupportEnabled,
      isBitcoinTestnetSupportEnabled,
      isTronTestnetSupportEnabled,
    ): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
      const filteredNonEvmNetworkConfigurationsByChainId: Record<
        CaipChainId,
        InternalMultichainNetworkConfiguration
      > = {};

      // This is not ideal but since there are only three non EVM networks
      // we can just filter them out based on the support enabled
      const { bitcoinEnabled, solanaEnabled, tronEnabled } =
        isNonEvmNetworksEnabled;

      if (
        bitcoinEnabled &&
        multichainNetworkConfigurationsByChainId &&
        multichainNetworkConfigurationsByChainId[BtcScope.Mainnet]
      ) {
        filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Mainnet] =
          multichainNetworkConfigurationsByChainId[BtcScope.Mainnet];
      }

      if (
        bitcoinEnabled &&
        isBitcoinTestnetSupportEnabled &&
        multichainNetworkConfigurationsByChainId
      ) {
        if (multichainNetworkConfigurationsByChainId[BtcScope.Testnet]) {
          filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Testnet] =
            multichainNetworkConfigurationsByChainId[BtcScope.Testnet];
        }
        if (multichainNetworkConfigurationsByChainId[BtcScope.Signet]) {
          filteredNonEvmNetworkConfigurationsByChainId[BtcScope.Signet] =
            multichainNetworkConfigurationsByChainId[BtcScope.Signet];
        }
      }

      if (
        solanaEnabled &&
        multichainNetworkConfigurationsByChainId &&
        multichainNetworkConfigurationsByChainId[SolScope.Mainnet]
      ) {
        filteredNonEvmNetworkConfigurationsByChainId[SolScope.Mainnet] =
          multichainNetworkConfigurationsByChainId[SolScope.Mainnet];
      }

      if (
        solanaEnabled &&
        isSolanaTestnetSupportEnabled &&
        multichainNetworkConfigurationsByChainId &&
        multichainNetworkConfigurationsByChainId[SolScope.Devnet]
      ) {
        filteredNonEvmNetworkConfigurationsByChainId[SolScope.Devnet] =
          multichainNetworkConfigurationsByChainId[SolScope.Devnet];
      }

      if (
        tronEnabled &&
        multichainNetworkConfigurationsByChainId &&
        multichainNetworkConfigurationsByChainId[TrxScope.Mainnet]
      ) {
        filteredNonEvmNetworkConfigurationsByChainId[TrxScope.Mainnet] =
          multichainNetworkConfigurationsByChainId[TrxScope.Mainnet];
      }

      if (
        tronEnabled &&
        isTronTestnetSupportEnabled &&
        multichainNetworkConfigurationsByChainId &&
        multichainNetworkConfigurationsByChainId[TrxScope.Nile] &&
        multichainNetworkConfigurationsByChainId[TrxScope.Shasta]
      ) {
        filteredNonEvmNetworkConfigurationsByChainId[TrxScope.Nile] =
          multichainNetworkConfigurationsByChainId[TrxScope.Nile];
        filteredNonEvmNetworkConfigurationsByChainId[TrxScope.Shasta] =
          multichainNetworkConfigurationsByChainId[TrxScope.Shasta];
      }

      return filteredNonEvmNetworkConfigurationsByChainId;
    },
  );

/**
 * Returns all EVM networks converted to multichain network configuration format.
 * This selector provides stable references when the underlying data hasn't changed.
 */
export const getEvmMultichainNetworkConfigurations = createSelector(
  getNetworkConfigurationsByChainId,
  (
    networkConfigurationsByChainId,
  ): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
    // There's a fallback for EVM network names/nicknames, in case the network
    // does not have a name/nickname the fallback is the first rpc endpoint url.
    // TODO: Update toMultichainNetworkConfigurationsByChainId to handle this case.
    const evmNetworks: Record<
      CaipChainId,
      InternalMultichainNetworkConfiguration
    > = {};

    for (const [, network] of Object.entries(networkConfigurationsByChainId)) {
      evmNetworks[toEvmCaipChainId(network.chainId)] = {
        ...toMultichainNetworkConfiguration(network),
        name:
          network.name ||
          network.rpcEndpoints[network.defaultRpcEndpointIndex].url,
      };
    }

    return evmNetworks;
  },
);

/**
 * Returns all multichain network configurations (both EVM and non-EVM) by chain ID.
 * This selector provides stable references when the underlying data hasn't changed.
 */
export const getAllMultichainNetworkConfigurations = createSelector(
  getNonEvmMultichainNetworkConfigurationsByChainId,
  getEvmMultichainNetworkConfigurations,
  (
    nonEvmNetworkConfigurationsByChainId,
    evmNetworks,
  ): Record<CaipChainId, InternalMultichainNetworkConfiguration> => {
    return {
      ...nonEvmNetworkConfigurationsByChainId,
      ...evmNetworks,
    };
  },
);

/**
 * Returns a tuple of [multichain networks, EVM network configurations].
 * This selector provides stable references when the underlying data hasn't changed.
 *
 * @deprecated Prefer using `getAllMultichainNetworkConfigurations` for multichain networks
 * or `getNetworkConfigurationsByChainId` for EVM-only networks directly.
 */
export const getMultichainNetworkConfigurationsByChainId = createSelector(
  getAllMultichainNetworkConfigurations,
  getNetworkConfigurationsByChainId,
  (
    networks,
    networkConfigurationsByChainId,
  ): [
    Record<CaipChainId, InternalMultichainNetworkConfiguration>,
    Record<Hex, InternalNetworkConfiguration>,
  ] => {
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

export const getSelectedMultichainNetworkConfiguration = createSelector(
  getSelectedMultichainNetworkChainId,
  getAllMultichainNetworkConfigurations,
  (chainId, networkConfigurationsByChainId) => {
    return networkConfigurationsByChainId[chainId];
  },
);

export const getNetworksWithActivity = (state: MultichainNetworkConfigState) =>
  state.metamask.networksWithTransactionActivity;

export const getEnabledNetworksByNamespace = createSelector(
  getEnabledNetworks,
  getSelectedMultichainNetworkChainId,
  (enabledNetworkMap, currentMultichainChainId) => {
    const { namespace } = parseCaipChainId(currentMultichainChainId);
    const namespaceMap = enabledNetworkMap[namespace] ?? {};

    return Object.fromEntries(
      Object.entries(namespaceMap).filter(([, enabled]) => enabled === true),
    );
  },
);

export const getAllEnabledNetworksForAllNamespaces = createSelector(
  getEnabledNetworks,
  (enabledNetworkMap) =>
    Object.values(enabledNetworkMap).flatMap((namespaceNetworks) =>
      Object.entries(namespaceNetworks)
        .filter(([, enabled]) => enabled)
        .map(([chainId]) => chainId),
    ),
);

export const selectEnabledNetworksAsCaipChainIds = createSelector(
  getEnabledNetworks,
  (enabledNetworkMap): CaipChainId[] =>
    Object.entries(enabledNetworkMap)
      .flatMap(([namespace, namespaceNetworks]) =>
        Object.entries(namespaceNetworks)
          .filter(([, enabled]) => enabled)
          .map(([chainId]) =>
            namespace === KnownCaipNamespace.Eip155
              ? toEvmCaipChainId(chainId as Hex)
              : (chainId as CaipChainId),
          ),
      )
      .sort(),
);

export const selectNonEvmChainIds = createSelector(
  getEnabledNetworks,
  (enabledNetworkMap) =>
    Object.entries(enabledNetworkMap)
      .filter(([namespace]) => namespace !== 'eip155')
      .flatMap(([, chains]) =>
        Object.entries(chains)
          .filter(([, enabled]) => enabled)
          .map(([id]) => id),
      ),
);

export const getEnabledChainIds = createSelector(
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

export const getEnabledNetworkClientIds = createSelector(
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
    const enabledEvmNetworks = enabledNetworks[KnownCaipNamespace.Eip155] ?? {};
    const enabledChainIds = Object.entries(enabledEvmNetworks)
      .filter(([, isEnabled]) => isEnabled)
      .map(([chainId]) => chainId as Hex);

    for (const chainId of enabledChainIds) {
      const networkConfiguration = networkConfigurationsByChainId[chainId];
      if (networkConfiguration) {
        // Get the network client ID directly from the network configuration
        const { rpcEndpoints, defaultRpcEndpointIndex, name } =
          networkConfiguration;
        const rpcEndpoint = rpcEndpoints[defaultRpcEndpointIndex];

        if (rpcEndpoint) {
          const metadata = networksMetadata[rpcEndpoint.networkClientId];

          if (
            metadata !== undefined &&
            metadata.status !== NetworkStatus.Available
          ) {
            const isInfuraEndpoint = getIsMetaMaskInfuraEndpointUrl(
              rpcEndpoint.url,
              infuraProjectId ?? '',
            );

            // For custom endpoints (non-Infura), check if there's an Infura
            // endpoint available for this network that we can switch to
            let infuraEndpointIndex: number | undefined;
            if (!isInfuraEndpoint) {
              infuraEndpointIndex = rpcEndpoints.findIndex(
                (endpoint, index) =>
                  index !== defaultRpcEndpointIndex &&
                  getIsMetaMaskInfuraEndpointUrl(
                    endpoint.url,
                    infuraProjectId ?? '',
                  ),
              );
              // If no Infura endpoint found, set to undefined
              if (infuraEndpointIndex === -1) {
                infuraEndpointIndex = undefined;
              }
            }

            return {
              networkClientId: rpcEndpoint.networkClientId,
              chainId,
              networkName: name,
              // We have to use this function to check whether the endpoint is
              // an Infura endpoint because some Infura endpoint URLs use the
              // wrong type.
              isInfuraEndpoint,
              // Index of an available Infura endpoint (for custom networks that
              // have one) that can be used to switch to Infura
              infuraEndpointIndex,
            };
          }
        }
      }
    }
    return null;
  },
);

// TODO: Remove after updating to @metamask/network-controller 20.0.0
export type ProviderConfigWithImageUrlAndExplorerUrl = {
  rpcUrl?: string;
  type: NetworkType;
  chainId: Hex;
  ticker: string;
  nickname?: string;
  id?: string;
} & {
  rpcPrefs?: { blockExplorerUrl?: string; imageUrl?: string };
};

export type MultichainNetwork = {
  nickname: string;
  isEvmNetwork: boolean;
  chainId: CaipChainId;
  network: // TODO: Maybe updates ProviderConfig to add rpcPrefs.imageUrl field
  ProviderConfigWithImageUrlAndExplorerUrl | MultichainProviderConfig;
};

function getMultichainNetworkProviders(
  _state: MultichainNetworkConfigState,
): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return Object.values(MULTICHAIN_PROVIDER_CONFIGS);
}

// FIXME: All the following might have side-effect, like if the current account is a bitcoin one and that
// a popup (for ethereum related stuffs) is being shown (and uses this function), then the native
// currency will be BTC..

export function getMultichainIsEvm(
  state: MultichainNetworkConfigState &
    AccountsState & { metamask: { completedOnboarding?: boolean } },
  account?: InternalAccount,
) {
  const isOnboarded = state.metamask.completedOnboarding;
  // Selected account is not available during onboarding (this is used in
  // the AppHeader)
  const selectedAccount = account ?? getMaybeSelectedInternalAccount(state);

  // There are no selected account during onboarding. we default to the original EVM behavior.
  return (
    !isOnboarded || !selectedAccount || isEvmAccountType(selectedAccount.type)
  );
}

export function getMultichainNetwork(
  state: MultichainNetworkConfigState & AccountsState,
  account?: InternalAccount,
): MultichainNetwork {
  const isEvm = getMultichainIsEvm(state, account);

  if (isEvm) {
    // EVM networks
    const evmChainId: Hex = getCurrentChainId(state);

    // TODO: Update to use network configurations when @metamask/network-controller is updated to 20.0.0
    // ProviderConfig will be deprecated to use NetworkConfigurations
    // When a user updates a network name its only updated in the NetworkConfigurations.
    const evmNetwork: ProviderConfigWithImageUrlAndExplorerUrl =
      getProviderConfig(state) as ProviderConfigWithImageUrlAndExplorerUrl;

    const evmChainIdKey =
      evmChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

    evmNetwork.rpcPrefs = {
      ...evmNetwork.rpcPrefs,
      imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey],
    };

    const networkConfigurations = getNetworkConfigurationsByChainId(state);
    return {
      nickname: networkConfigurations[evmChainId]?.name ?? evmNetwork.rpcUrl,
      isEvmNetwork: true,
      // We assume the chain ID is `string` or `number`, so we convert it to a
      // `Number` to be compliant with EIP155 CAIP chain ID
      chainId: `${KnownCaipNamespace.Eip155}:${Number(
        evmChainId,
      )}` as CaipChainId,
      network: evmNetwork,
    };
  }

  // Non-EVM networks:
  // (Hardcoded for testing)
  // HACK: For now, we rely on the account type being "sort-of" CAIP compliant, so use
  // this as a CAIP-2 namespace and apply our filter with it
  // For non-EVM, we know we have a selected account, since the logic `isEvm` is based
  // on having a non-EVM account being selected!
  const selectedAccount = account ?? getSelectedInternalAccount(state);
  const nonEvmNetworks = getMultichainNetworkProviders(state);

  const selectedChainId = state.metamask.selectedMultichainNetworkChainId;

  let nonEvmNetwork: MultichainProviderConfig | undefined;

  // FIRST: Try to find network by account scopes (most specific)
  if (selectedAccount.scopes.length > 0) {
    nonEvmNetwork = nonEvmNetworks.find((provider) => {
      return selectedAccount.scopes.includes(provider.chainId);
    });
  }

  // SECOND: If no network found by scopes, try selectedChainId
  if (!nonEvmNetwork && selectedChainId) {
    nonEvmNetwork = nonEvmNetworks.find(
      (provider) => provider.chainId === selectedChainId,
    );
  }

  // THIRD: Final fallback - address compatibility check
  if (!nonEvmNetwork) {
    nonEvmNetwork = nonEvmNetworks.find((provider) => {
      return provider.isAddressCompatible(selectedAccount.address);
    });
  }

  if (!nonEvmNetwork) {
    throw new Error(
      'Could not find non-EVM provider for the current configuration. This should never happen.',
    );
  }

  return {
    // TODO: Adapt this for other non-EVM networks
    nickname: nonEvmNetwork.nickname,
    isEvmNetwork: false,
    chainId: nonEvmNetwork.chainId,
    network: nonEvmNetwork,
  };
}
