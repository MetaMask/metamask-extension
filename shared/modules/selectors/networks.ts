import {
  MultichainNetworkConfiguration,
  type MultichainNetworkConfiguration as InternalMultichainNetworkConfiguration,
  NON_EVM_TESTNET_IDS,
} from '@metamask/multichain-network-controller';
import {
  RpcEndpointType,
  type NetworkState as InternalNetworkState,
  type NetworkConfiguration as InternalNetworkConfiguration,
  NetworkConfiguration,
} from '@metamask/network-controller';
import { createSelector } from 'reselect';
import { AccountsControllerState } from '@metamask/accounts-controller';
import type { CaipChainId } from '@metamask/utils';
import {
  CAIP_FORMATTED_EVM_TEST_CHAINS,
  NetworkStatus,
} from '../../constants/network';
import { hexToDecimal } from '../conversion.utils';
import { createDeepEqualSelector } from './util';

export type NetworkState = {
  metamask: InternalNetworkState;
};

export type NetworkConfigurationsState = {
  metamask: {
    networkConfigurations: Record<string, InternalNetworkConfiguration>;
  };
};

export type SelectedNetworkClientIdState = {
  metamask: Pick<InternalNetworkState, 'selectedNetworkClientId'>;
};

export type NetworkConfigurationsByChainIdState = {
  metamask: Pick<InternalNetworkState, 'networkConfigurationsByChainId'>;
};

export type NetworksMetadataState = {
  metamask: Pick<InternalNetworkState, 'networksMetadata'>;
};

export type ProviderConfigState = NetworkConfigurationsByChainIdState &
  SelectedNetworkClientIdState;

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

export type EvmAndMultichainNetworkConfigurationsWithCaipChainId = (
  | NetworkConfiguration
  | MultichainNetworkConfiguration
) & {
  caipChainId: CaipChainId;
};

export const getNetworkConfigurationsByChainId = createDeepEqualSelector(
  (state: NetworkConfigurationsByChainIdState) =>
    state.metamask.networkConfigurationsByChainId,
  (networkConfigurationsByChainId) => networkConfigurationsByChainId,
);

export function getSelectedNetworkClientId(
  state: SelectedNetworkClientIdState,
) {
  return state.metamask.selectedNetworkClientId;
}

/**
 * Combines and returns network configurations for all chains (EVM and not) by caip chain id.
 *
 * @param params - The parameters object.
 * @param params.multichainNetworkConfigurationsByChainId - network configurations by caip chain id from the MultichainNetworkController state.
 * @param params.networkConfigurationsByChainId - network configurations by hex chain id from the NetworkController state.
 * @param params.internalAccounts - InternalAccounts object from the AccountController state.
 * @returns A consolidated object containing all available network configurations by caip chain id.
 */
export const getNetworkConfigurationsByCaipChainId = ({
  multichainNetworkConfigurationsByChainId,
  networkConfigurationsByChainId,
  internalAccounts,
}: {
  multichainNetworkConfigurationsByChainId: Record<
    CaipChainId,
    InternalMultichainNetworkConfiguration
  >;
  networkConfigurationsByChainId: Record<string, InternalNetworkConfiguration>;
  internalAccounts: AccountsControllerState['internalAccounts'];
}) => {
  const caipFormattedEvmNetworkConfigurations: Record<
    string,
    InternalNetworkConfiguration | InternalMultichainNetworkConfiguration
  > = {};

  Object.entries(networkConfigurationsByChainId).forEach(
    ([chainId, network]) => {
      const caipChainId = `eip155:${hexToDecimal(chainId)}`;
      caipFormattedEvmNetworkConfigurations[caipChainId] = network;
    },
  );

  // For now we need to filter out networkConfigurations/scopes without accounts because
  // the `endowment:caip25` caveat validator will throw if there are no supported accounts for the given scope
  // due to how the `MultichainRouter.isSupportedScope()` method is implemented
  Object.entries(multichainNetworkConfigurationsByChainId).forEach(
    ([caipChainId, networkConfig]) => {
      const matchesAccount = Object.values(internalAccounts.accounts).some(
        (account) => {
          const matchesScope = account.scopes.some((scope) => {
            return scope === caipChainId;
          });

          const isSnapEnabled = account.metadata.snap?.enabled;

          return matchesScope && isSnapEnabled;
        },
      );

      if (matchesAccount) {
        caipFormattedEvmNetworkConfigurations[caipChainId] = networkConfig;
      }
    },
  );

  return caipFormattedEvmNetworkConfigurations;
};

/**
 * Combines and returns network configurations for all chains (EVM and not).
 *
 * @param state - Redux state.
 * @returns A consolidated object containing all available network configurations.
 */
export const getAllNetworkConfigurationsByCaipChainId = createSelector(
  (state: MultichainNetworkConfigurationsByChainIdState) =>
    state.metamask.networkConfigurationsByChainId,
  (state: MultichainNetworkConfigurationsByChainIdState) =>
    state.metamask.multichainNetworkConfigurationsByChainId,
  (state: {
    metamask: { internalAccounts: AccountsControllerState['internalAccounts'] };
  }) => state.metamask.internalAccounts,
  (
    networkConfigurationsByChainId,
    multichainNetworkConfigurationsByChainId,
    internalAccounts,
  ) => {
    // We have this logic here to filter out non EVM test networks
    // to properly handle this we should use the selector from
    // multichain/networks.ts in the UI side
    const { nonEvmNetworks, nonEvmTestNetworks } = Object.keys(
      multichainNetworkConfigurationsByChainId,
    ).reduce(
      (
        result: {
          nonEvmNetworks: Record<
            CaipChainId,
            InternalMultichainNetworkConfiguration
          >;
          nonEvmTestNetworks: Record<
            CaipChainId,
            InternalMultichainNetworkConfiguration
          >;
        },
        key: string,
      ) => {
        const caipKey = key as CaipChainId;
        if (NON_EVM_TESTNET_IDS.includes(caipKey)) {
          result.nonEvmTestNetworks[caipKey] =
            multichainNetworkConfigurationsByChainId[caipKey];
        } else {
          result.nonEvmNetworks[caipKey] =
            multichainNetworkConfigurationsByChainId[caipKey];
        }
        return result;
      },
      {
        nonEvmNetworks: {} as Record<
          CaipChainId,
          InternalMultichainNetworkConfiguration
        >,
        nonEvmTestNetworks: {} as Record<
          CaipChainId,
          InternalMultichainNetworkConfiguration
        >,
      },
    );

    return getNetworkConfigurationsByCaipChainId({
      multichainNetworkConfigurationsByChainId: {
        ...nonEvmNetworks,
        ...nonEvmTestNetworks,
      },
      networkConfigurationsByChainId,
      internalAccounts,
    });
  },
);

/**
 * Get the provider configuration for the current selected network.
 *
 * @param state - Redux state object.
 * @throws `new Error('Provider configuration not found')` If the provider configuration is not found.
 */
export const getProviderConfig = createSelector(
  (state: ProviderConfigState) => getNetworkConfigurationsByChainId(state),
  getSelectedNetworkClientId,
  (networkConfigurationsByChainId, selectedNetworkClientId) => {
    for (const network of Object.values(networkConfigurationsByChainId)) {
      for (const rpcEndpoint of network.rpcEndpoints) {
        if (rpcEndpoint.networkClientId === selectedNetworkClientId) {
          const blockExplorerUrl =
            network.defaultBlockExplorerUrlIndex === undefined
              ? undefined
              : network.blockExplorerUrls?.[
                  network.defaultBlockExplorerUrlIndex
                ];

          return {
            chainId: network.chainId,
            ticker: network.nativeCurrency,
            rpcPrefs: { ...(blockExplorerUrl && { blockExplorerUrl }) },
            type:
              rpcEndpoint.type === RpcEndpointType.Custom
                ? 'rpc'
                : rpcEndpoint.networkClientId,
            ...(rpcEndpoint.type === RpcEndpointType.Custom && {
              id: rpcEndpoint.networkClientId,
              nickname: network.name,
              rpcUrl: rpcEndpoint.url,
            }),
          };
        }
      }
    }
    throw new Error('Provider configuration not found');
  },
);

export function getNetworkConfigurations(
  state: NetworkConfigurationsState,
): Record<string, InternalNetworkConfiguration> {
  return state.metamask.networkConfigurations;
}

/**
 * Returns true if the currently selected network is inaccessible or whether no
 * provider has been set yet for the currently selected network.
 *
 * @param state - Redux state object.
 */
export function isNetworkLoading(state: NetworkState) {
  const selectedNetworkClientId = getSelectedNetworkClientId(state);
  return (
    selectedNetworkClientId &&
    state.metamask.networksMetadata[selectedNetworkClientId].status !==
      NetworkStatus.Available
  );
}

export function getInfuraBlocked(
  state: SelectedNetworkClientIdState & NetworksMetadataState,
) {
  return (
    state.metamask.networksMetadata[getSelectedNetworkClientId(state)]
      .status === NetworkStatus.Blocked
  );
}

export function getCurrentChainId(state: ProviderConfigState) {
  const { chainId } = getProviderConfig(state);
  return chainId;
}

export const getIsAllNetworksFilterEnabled = createSelector(
  getNetworkConfigurationsByChainId,
  (allNetworks) => {
    const allOpts: Record<string, boolean> = {};
    Object.keys(allNetworks || {}).forEach((chain) => {
      allOpts[chain] = true;
    });
    return allOpts;
  },
);

/**
 * Returns all available network configurations without test networks.
 *
 * @param state - Redux state object.
 * @returns Array of network configurations, excluding test networks.
 */
export const getNonTestNetworks = createSelector(
  [getAllNetworkConfigurationsByCaipChainId],
  (
    networkConfigurationsByCaipChainId,
  ): EvmAndMultichainNetworkConfigurationsWithCaipChainId[] => {
    return Object.entries(networkConfigurationsByCaipChainId)
      .filter(([chainId]) => {
        const caipChainId = chainId as CaipChainId;
        return (
          !CAIP_FORMATTED_EVM_TEST_CHAINS.includes(caipChainId) &&
          !NON_EVM_TESTNET_IDS.includes(caipChainId)
        );
      })
      .map(([chainId, network]) => ({
        ...network,
        caipChainId: chainId as CaipChainId,
      }));
  },
);

/**
 * Returns an array of simplified network configurations available based on the CAIP account scopes,
 * without test networks.
 *
 * @param _state - Redux state object.
 * @param scopes - Array of CAIP account scopes to filter networks by.
 * @returns Array of network configurations with chainId and name, filtered by provided scopes.
 */
export const getNetworksByScopes = createSelector(
  [getNonTestNetworks, (_state, scopes: string[]) => scopes],
  (nonTestNetworks, scopes): { chainId: string | number; name: string }[] => {
    if (!scopes) {
      return [];
    }

    return scopes.reduce(
      (result: { chainId: string | number; name: string }[], scope) => {
        // Special case for eip155:0 - include all EVM networks
        if (scope === 'eip155:0') {
          const evmNetworks = nonTestNetworks
            .filter((network) => network.caipChainId?.startsWith('eip155:'))
            .map((network) => ({
              chainId: network.chainId,
              name: network.name,
            }));

          return [...result, ...evmNetworks];
        }

        const matchingNetwork = nonTestNetworks.find(
          (network) => network.caipChainId === scope,
        );

        if (matchingNetwork) {
          return [
            ...result,
            {
              chainId: matchingNetwork.chainId,
              name: matchingNetwork.name,
            },
          ];
        }

        return result;
      },
      [],
    );
  },
);
