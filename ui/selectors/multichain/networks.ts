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
  XlmScope,
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
} from '../../../shared/lib/selectors/networks';
import { createDeepEqualSelector } from '../../../shared/lib/selectors/selector-creators';
import { getEnabledNetworks } from '../../../shared/lib/selectors/multichain';
import { getIsMetaMaskInfuraEndpointUrl } from '../../../shared/lib/network-utils';
import { getDomain } from '../../../shared/lib/url-utils';
import type { RemoteFeatureFlagsState } from '../../../shared/lib/selectors/remote-feature-flags';
import {
  type AccountsState,
  getSelectedInternalAccount,
  getMaybeSelectedInternalAccount,
} from '../../../shared/lib/selectors/accounts';
import { getInternalAccounts } from '../accounts';
import {
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsSolanaTestnetSupportEnabled,
  getIsBitcoinTestnetSupportEnabled,
  getIsTronSupportEnabled,
  getIsTronTestnetSupportEnabled,
  getIsStellarSupportEnabled,
} from './feature-flags';

// Selector types

export type MultichainNetworkControllerState = {
  metamask: InternalMultichainNetworkState;
};

type SelectedNetworkChainIdState = {
  metamask: Pick<
    InternalMultichainNetworkState,
    'selectedMultichainNetworkChainId'
  >;
};

type IsEvmSelectedState = {
  metamask: Pick<InternalMultichainNetworkState, 'isEvmSelected'>;
};

type NetworksWithTransactionActivityByAccountsState = {
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

const getIsNonEvmNetworksEnabled = createSelector(
  getIsBitcoinSupportEnabled,
  getIsSolanaSupportEnabled,
  getIsTronSupportEnabled,
  getIsStellarSupportEnabled,
  getInternalAccounts,
  (
    isBitcoinEnabled,
    isSolanaEnabled,
    isTronEnabled,
    isStellarEnabled,
    internalAccounts,
  ) => {
    if (
      isBitcoinEnabled &&
      isSolanaEnabled &&
      isTronEnabled &&
      isStellarEnabled
    ) {
      return {
        bitcoinEnabled: true,
        solanaEnabled: true,
        tronEnabled: true,
        stellarEnabled: true,
      };
    }

    let bitcoinEnabled = isBitcoinEnabled;
    let solanaEnabled = isSolanaEnabled;
    let tronEnabled = isTronEnabled;
    let stellarEnabled = isStellarEnabled;

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
      if (scopes?.includes(XlmScope.Pubnet)) {
        stellarEnabled = true;
      }
      if (bitcoinEnabled && solanaEnabled && tronEnabled && stellarEnabled) {
        break;
      }
    }

    return { bitcoinEnabled, solanaEnabled, tronEnabled, stellarEnabled };
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

      // This is not ideal but since there are only a few non-EVM networks
      // we can just filter them out based on the support enabled
      const { bitcoinEnabled, solanaEnabled, tronEnabled, stellarEnabled } =
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

      if (
        stellarEnabled &&
        multichainNetworkConfigurationsByChainId &&
        multichainNetworkConfigurationsByChainId[XlmScope.Pubnet]
      ) {
        filteredNonEvmNetworkConfigurationsByChainId[XlmScope.Pubnet] =
          multichainNetworkConfigurationsByChainId[XlmScope.Pubnet];
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

/**
 * Network configurations and their RPC endpoints annotated with information
 * that the network connection banner logic cares about: whether the endpoint is
 * an Infura URL, whether its current metadata status is anything other than
 * Available ("failed"), and its registrable domain. The network itself also
 * gets an `infuraEndpointIndex` pointing at the first Infura endpoint (used by
 * the "Switch to Infura" CTA).
 */
const selectEnhancedNetworkConfigurationsByChainId = createSelector(
  getNetworkConfigurationsByChainId,
  getNetworksMetadata,
  (networkConfigurationsByChainId, networksMetadata) => {
    const enhancedNetworkConfigurationsByChainId: Record<
      Hex,
      Omit<(typeof networkConfigurationsByChainId)[Hex], 'rpcEndpoints'> & {
        rpcEndpoints: {
          networkClientId: string;
          url: string;
          isInfuraEndpoint: boolean;
          isFailed: boolean;
          domain: string | null;
        }[];
        infuraEndpointIndex: number | undefined;
      }
    > = {};

    for (const [chainId, networkConfiguration] of Object.entries(
      networkConfigurationsByChainId,
    )) {
      const enhancedRpcEndpoints = networkConfiguration.rpcEndpoints.map(
        (rpcEndpoint) => {
          const metadata = networksMetadata[rpcEndpoint.networkClientId];
          // We have to use this function to check whether the endpoint is
          // an Infura endpoint because some Infura endpoint URLs use the
          // wrong type.
          const isInfuraEndpoint = getIsMetaMaskInfuraEndpointUrl(
            rpcEndpoint.url,
            infuraProjectId ?? '',
          );
          const isFailed =
            metadata !== undefined &&
            metadata.status !== NetworkStatus.Available;

          return {
            networkClientId: rpcEndpoint.networkClientId,
            url: rpcEndpoint.url,
            isInfuraEndpoint,
            isFailed,
            domain: getDomain(rpcEndpoint.url),
          };
        },
      );

      const firstInfuraIndex = enhancedRpcEndpoints.findIndex(
        (rpcEndpoint) => rpcEndpoint.isInfuraEndpoint,
      );

      enhancedNetworkConfigurationsByChainId[chainId as Hex] = {
        ...networkConfiguration,
        rpcEndpoints: enhancedRpcEndpoints,
        infuraEndpointIndex:
          firstInfuraIndex === -1 ? undefined : firstInfuraIndex,
      };
    }

    return enhancedNetworkConfigurationsByChainId;
  },
);

/**
 * The list of enabled EVM networks whose default RPC endpoint is currently
 * failing, plus a flag for whether every enabled network is failing. Used as
 * the input to the network connection banner show/hide rule.
 */
const selectEnabledFailedNetworksResult = createSelector(
  getEnabledNetworks,
  selectEnhancedNetworkConfigurationsByChainId,
  (enabledNetworks, enhancedNetworkConfigurationsByChainId) => {
    const enabledEvmNetworks = enabledNetworks[KnownCaipNamespace.Eip155] ?? {};
    const enabledEvmChainIds = Object.entries(enabledEvmNetworks)
      .filter(([, isEnabled]) => isEnabled)
      .map(([chainId]) => chainId as Hex);

    const failedNetworks: {
      networkClientId: string;
      chainId: Hex;
      networkName: string;
      isInfuraEndpoint: boolean;
      infuraEndpointIndex: number | undefined;
      domain: string | null;
    }[] = [];
    let totalEnabled = 0;

    for (const chainId of enabledEvmChainIds) {
      const networkConfiguration =
        enhancedNetworkConfigurationsByChainId[chainId];
      if (!networkConfiguration) {
        continue;
      }

      const {
        rpcEndpoints,
        defaultRpcEndpointIndex,
        name,
        infuraEndpointIndex,
      } = networkConfiguration;
      const defaultRpcEndpoint = rpcEndpoints[defaultRpcEndpointIndex];
      if (!defaultRpcEndpoint) {
        continue;
      }

      totalEnabled += 1;

      if (!defaultRpcEndpoint.isFailed) {
        continue;
      }

      failedNetworks.push({
        networkClientId: defaultRpcEndpoint.networkClientId,
        chainId,
        networkName: name,
        isInfuraEndpoint: defaultRpcEndpoint.isInfuraEndpoint,
        // Only useful when the default is non-Infura — otherwise the CTA to
        // switch to Infura is hidden anyway.
        infuraEndpointIndex: defaultRpcEndpoint.isInfuraEndpoint
          ? undefined
          : infuraEndpointIndex,
        domain: defaultRpcEndpoint.domain,
      });
    }

    return {
      failedNetworks,
      areAllEnabledNetworksFailed:
        failedNetworks.length > 0 && failedNetworks.length === totalEnabled,
    };
  },
);

/**
 * Returns the first failed EVM network that should drive the network connection
 * banner, or null when no banner should be shown.
 *
 * A network is "failed" here when its default RPC endpoint's status is anything
 * other than `NetworkStatus.Available`.
 *
 * The banner always shows for custom networks because users always have the
 * option to switch to a built-in network, and we surface that custom network
 * first so the "Switch to MetaMask default RPC" CTA points at it. For all
 * other networks the banner is intentionally noisy-averse: a single provider's
 * wide outage (e.g. an Infura-wide hiccup that takes down many *.infura.io
 * networks at once) is suppressed because it looks like many failed networks
 * but is really one provider. The banner shows only when failed RPCs span
 * 2+ distinct domains (likely client-side), or every enabled EVM network has
 * failed (covers single-network setups), or any failed network's active RPC
 * is a non-Infura (custom) endpoint — these have no automatic failover so the
 * user must be told.
 */
export const selectFirstFailedNetworkForNetworkConnectionBanner =
  createSelector(
    selectEnabledFailedNetworksResult,
    ({ failedNetworks, areAllEnabledNetworksFailed }) => {
      const firstCustomFailed = failedNetworks.find((n) => !n.isInfuraEndpoint);
      const distinctDomains = new Set(
        failedNetworks
          .map((n) => n.domain)
          .filter((domain): domain is string => domain !== null),
      ).size;

      // Show the banner if:
      // - The first failing network is a custom network (we assume users always
      //   want to be informed about errors with RPC endpoints they've chosen)
      // - There are failures across more than one domain (likely client-side
      //   issue)
      // - All enabled networks are failing (likely client-side issue)
      if (
        firstCustomFailed ||
        distinctDomains > 1 ||
        areAllEnabledNetworksFailed
      ) {
        const selected = firstCustomFailed ?? failedNetworks[0];

        return {
          networkClientId: selected.networkClientId,
          chainId: selected.chainId,
          networkName: selected.networkName,
          isInfuraEndpoint: selected.isInfuraEndpoint,
          infuraEndpointIndex: selected.infuraEndpointIndex,
        };
      }

      return null;
    },
  );

// TODO: Remove after updating to @metamask/network-controller 20.0.0
type ProviderConfigWithImageUrlAndExplorerUrl = {
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
  // TODO: Maybe updates ProviderConfig to add rpcPrefs.imageUrl field
  network: ProviderConfigWithImageUrlAndExplorerUrl | MultichainProviderConfig;
};

const MULTICHAIN_NETWORK_PROVIDERS: MultichainProviderConfig[] = Object.values(
  MULTICHAIN_PROVIDER_CONFIGS,
);

function getMultichainNetworkProviders(
  _state: MultichainNetworkConfigState,
): MultichainProviderConfig[] {
  // TODO: need state from the ChainController?
  return MULTICHAIN_NETWORK_PROVIDERS;
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

export const getMultichainNetwork = createSelector(
  [
    (
      state: MultichainNetworkConfigState & AccountsState,
      account?: InternalAccount,
    ) => getMultichainIsEvm(state, account),
    (
      state: MultichainNetworkConfigState & AccountsState,
      account?: InternalAccount,
    ) =>
      getMultichainIsEvm(state, account)
        ? getCurrentChainId(state)
        : (undefined as never),
    (
      state: MultichainNetworkConfigState & AccountsState,
      account?: InternalAccount,
    ) =>
      getMultichainIsEvm(state, account)
        ? getProviderConfig(state)
        : (undefined as never),
    getNetworkConfigurationsByChainId,
    (
      state: MultichainNetworkConfigState & AccountsState,
      account?: InternalAccount,
    ) => account ?? getSelectedInternalAccount(state),
    (state: MultichainNetworkConfigState & AccountsState) =>
      getMultichainNetworkProviders(state),
    (state: MultichainNetworkConfigState & AccountsState) =>
      state.metamask.selectedMultichainNetworkChainId,
  ],
  (
    isEvm,
    evmChainId,
    evmProviderConfig,
    networkConfigurations,
    selectedAccount,
    nonEvmNetworks,
    selectedChainId,
  ): MultichainNetwork => {
    if (isEvm) {
      const evmNetwork = {
        ...evmProviderConfig,
      } as ProviderConfigWithImageUrlAndExplorerUrl;
      const evmChainIdKey =
        evmChainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP;

      evmNetwork.rpcPrefs = {
        ...evmNetwork.rpcPrefs,
        imageUrl: CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[evmChainIdKey],
      };

      return {
        nickname: networkConfigurations[evmChainId]?.name ?? evmNetwork.rpcUrl,
        isEvmNetwork: true,
        chainId:
          `${KnownCaipNamespace.Eip155}:${Number(evmChainId)}` as CaipChainId,
        network: evmNetwork,
      };
    }

    let nonEvmNetwork: MultichainProviderConfig | undefined;

    if (selectedAccount.scopes.length > 0) {
      nonEvmNetwork = nonEvmNetworks.find((provider) => {
        return selectedAccount.scopes.includes(provider.chainId);
      });
    }

    if (!nonEvmNetwork && selectedChainId) {
      nonEvmNetwork = nonEvmNetworks.find(
        (provider) => provider.chainId === selectedChainId,
      );
    }

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
      nickname: nonEvmNetwork.nickname,
      isEvmNetwork: false,
      chainId: nonEvmNetwork.chainId,
      network: nonEvmNetwork,
    };
  },
);
