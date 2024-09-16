import { hasProperty, isObject, RuntimeObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
// Note: This is the library the network controller uses for URL
// validity / equality. Using here to ensure we match its validations.
import * as URI from 'uri-js';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  LINEA_MAINNET_DISPLAY_NAME,
  LINEA_SEPOLIA_DISPLAY_NAME,
  MAINNET_DISPLAY_NAME,
  NETWORK_TO_NAME_MAP,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 127;

/**
 * This migration converts the network controller's
 * `networkConfigurations` to a new field `networkConfigurationsByChainId`.
 *
 * Built-in Infura network configurations are now represented in this state,
 * where they weren't before. These Infura configurations are merged with the user's
 * custom configurations.  Then all configurations are grouped by chain id,
 * and merged to produce one network configuration per chain id.
 *
 * The `NetworkOrderController` is also migrated, which manages
 * the user's drag + drop preference order for the network menu.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(
  state: Record<string, unknown>,
): Record<string, unknown> {
  // Get the network controller state, or initialize
  // it if it's missing for some unexpected reason
  const networkState =
    hasProperty(state, 'NetworkController') && isObject(state.NetworkController)
      ? state.NetworkController
      : {};

  // Get the existing custom network configurations
  let networkConfigurations = isObject(networkState.networkConfigurations)
    ? Object.values(networkState.networkConfigurations)
    : [];

  // Prepend the built-in Infura network configurations,
  // since they are now included in the network controller state
  networkConfigurations = [
    {
      type: 'infura',
      id: 'mainnet',
      chainId: '0x1',
      ticker: 'ETH',
      nickname: MAINNET_DISPLAY_NAME,
      rpcUrl: 'https://mainnet.infura.io/v3/{infuraProjectId}',
      rpcPrefs: { blockExplorerUrl: 'https://etherscan.io' },
    },
    {
      type: 'infura',
      id: 'sepolia',
      chainId: '0xaa36a7',
      ticker: 'SepoliaETH',
      nickname: SEPOLIA_DISPLAY_NAME,
      rpcUrl: 'https://sepolia.infura.io/v3/{infuraProjectId}',
      rpcPrefs: { blockExplorerUrl: 'https://sepolia.etherscan.io' },
    },
    {
      type: 'infura',
      id: 'linea-sepolia',
      chainId: '0xe705',
      ticker: 'LineaETH',
      nickname: LINEA_SEPOLIA_DISPLAY_NAME,
      rpcUrl: 'https://linea-sepolia.infura.io/v3/{infuraProjectId}',
      rpcPrefs: { blockExplorerUrl: 'https://sepolia.lineascan.build' },
    },
    {
      type: 'infura',
      id: 'linea-mainnet',
      chainId: '0xe708',
      ticker: 'ETH',
      nickname: LINEA_MAINNET_DISPLAY_NAME,
      rpcUrl: 'https://linea-mainnet.infura.io/v3/{infuraProjectId}',
      rpcPrefs: { blockExplorerUrl: 'https://lineascan.build' },
    },
    ...networkConfigurations,
  ];

  // Group the network configurations by by chain id, producing
  // a mapping from chain id to an array of network configurations
  const networkConfigurationArraysByChainId = networkConfigurations.reduce(
    (acc: Record<string, RuntimeObject[]>, networkConfiguration) => {
      if (
        isObject(networkConfiguration) &&
        typeof networkConfiguration.chainId === 'string'
      ) {
        (acc[networkConfiguration.chainId] ??= []).push(networkConfiguration);
      }
      return acc;
    },
    {},
  );

  // Get transaction history in reverse chronological order to help with tie breaks
  const transactions: RuntimeObject[] =
    hasProperty(state, 'TransactionController') &&
    isObject(state.TransactionController) &&
    Array.isArray(state.TransactionController.transactions)
      ? state.TransactionController.transactions
          .filter(
            (tx) =>
              isObject(tx) &&
              typeof tx.time === 'number' &&
              typeof tx.networkClientId === 'string',
          )
          .sort((a, b) => b.time - a.time)
      : [];

  // For each chain id, merge the array of network configurations
  const networkConfigurationsByChainId = Object.entries(
    networkConfigurationArraysByChainId,
  ).reduce((acc: Record<string, unknown>, [chainId, networks]) => {
    //
    // Calculate the tie breaker network, whose values will be preferred
    let tieBreaker: RuntimeObject | undefined;

    // If one of the networks is the globally selected network, use that
    tieBreaker = networks.find(
      (network) => network.id === networkState.selectedNetworkClientId,
    );

    // Otherwise use the network that was most recently transacted on
    if (!tieBreaker) {
      transactions
        .filter((tx) => tx.chainId === chainId)
        .some(
          (tx) =>
            (tieBreaker = networks.find(
              (network) => network.id === tx.networkClientId,
            )),
        );
    }

    // If no transactions were found for the chain id,
    // try to fall back to the built in infura network
    if (!tieBreaker) {
      tieBreaker = networks.find((network) => network.type === 'infura');
    }

    // Calculate the unique set of valid rpc endpoints for this chain id
    const rpcEndpoints = networks.reduce(
      (endpoints: RuntimeObject[], network) => {
        if (network.id && network.rpcUrl) {
          //
          // Check if the endpoint is a duplicate, which the network controller doesn't allow
          const findDuplicate = (endpoint: unknown) =>
            isObject(endpoint) &&
            ((typeof endpoint.url === 'string' &&
              typeof network.rpcUrl === 'string' &&
              URI.equal(endpoint.url, network.rpcUrl)) ||
              // This should not be possible, but protect against duplicate network client ids
              endpoint.networkClientId === network.id);

          // The endpoint must be unique across all chains, not just within each
          const duplicateWithinChain = endpoints.find(findDuplicate);
          const duplicateAcrossChains = Object.values(acc)
            .flatMap((n) => (isObject(n) ? n.rpcEndpoints : []))
            .find(findDuplicate);

          if (
            duplicateWithinChain &&
            network.id === networkState.selectedNetworkClientId
          ) {
            // If there's a duplicate RPC url within a chain, and one of the
            // networks is the globally selected network, prefer to use its network
            // client id so that `selectedNetworkClientId` can remain unchanged.
            duplicateWithinChain.networkClientId = network.id;
          } else if (
            !duplicateWithinChain &&
            !duplicateAcrossChains &&
            typeof network.rpcUrl === 'string' &&
            isValidUrl(network.rpcUrl)
          ) {
            // The endpoint is unique and valid, so add it to the list
            endpoints.push({
              networkClientId: network.id,
              url: network.rpcUrl,
              type: network.type === 'infura' ? 'infura' : 'custom',
              ...(network.type !== 'infura' &&
                typeof network.nickname === 'string' &&
                network.nickname && { name: network.nickname }),
            });
          }
        }
        return endpoints;
      },
      [],
    );

    // If there were no valid unique endpoints, then omit the network
    // configuration for this chain id. The network controller requires
    // configurations to have at least 1 endpoint.
    if (rpcEndpoints.length === 0) {
      return acc;
    }

    // Use the tie breaker network as the default rpc endpoint
    const defaultRpcEndpointIndex = Math.max(
      rpcEndpoints.findIndex(
        (endpoint) => endpoint.networkClientId === tieBreaker?.id,
      ),
      // Or arbitrarily default to the first endpoint if we don't have a tie breaker
      0,
    );

    // Calculate the unique array of non-empty block explorer urls
    const blockExplorerUrls = [
      ...networks.reduce((urls, network) => {
        if (
          isObject(network.rpcPrefs) &&
          typeof network.rpcPrefs.blockExplorerUrl === 'string' &&
          network.rpcPrefs.blockExplorerUrl
        ) {
          urls.add(network.rpcPrefs.blockExplorerUrl);
        }
        return urls;
      }, new Set()),
    ];

    // Use the tie breaker network as the default block explorer, if it has one
    const defaultBlockExplorerUrlIndex =
      blockExplorerUrls.length === 0
        ? undefined
        : Math.max(
            blockExplorerUrls.findIndex(
              (url) =>
                isObject(tieBreaker?.rpcPrefs) &&
                url === tieBreaker.rpcPrefs.blockExplorerUrl,
            ),
            // Or arbitrarily default to the first url
            0,
          );

    // Use the cononical network name and currency, if we have constants for them.
    // Otherwise prefer the tie breaker's name + currency, if it defines them.
    // Otherwise fall back to the name + currency from arbitrary networks that define them.
    const name =
      NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ??
      tieBreaker?.nickname ??
      networks.find((n) => n.nickname)?.nickname;

    const nativeCurrency =
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ] ??
      tieBreaker?.ticker ??
      networks.find((n) => n.ticker)?.ticker;

    acc[chainId] = {
      chainId,
      rpcEndpoints,
      defaultRpcEndpointIndex,
      blockExplorerUrls,
      ...(defaultBlockExplorerUrlIndex !== undefined && {
        defaultBlockExplorerUrlIndex,
      }),
      name,
      nativeCurrency,
    };
    return acc;
  }, {});

  // Ensure that selectedNetworkClientId points to
  // some endpoint of some network configuration.
  let selectedNetworkClientId = Object.values(networkConfigurationsByChainId)
    .flatMap((n) =>
      isObject(n) && Array.isArray(n.rpcEndpoints) ? n.rpcEndpoints : [],
    )
    .find(
      (e) => e.networkClientId === networkState.selectedNetworkClientId,
    )?.networkClientId;

  // It may not, if its endpoint was not well formed
  // or a duplicate. In that case, fallback to mainnet
  if (!selectedNetworkClientId) {
    const mainnet = networkConfigurationsByChainId['0x1'];
    selectedNetworkClientId =
      isObject(mainnet) &&
      Array.isArray(mainnet.rpcEndpoints) &&
      typeof mainnet.defaultRpcEndpointIndex === 'number'
        ? mainnet.rpcEndpoints[mainnet.defaultRpcEndpointIndex].networkClientId
        : 'mainnet';
  }

  // Redirect domains in the selected network controller to
  // point to the default RPC endpoint for the corresponding chain
  if (
    hasProperty(state, 'SelectedNetworkController') &&
    isObject(state.SelectedNetworkController) &&
    hasProperty(state.SelectedNetworkController, 'domains') &&
    isObject(state.SelectedNetworkController.domains)
  ) {
    for (const [domain, networkClientId] of Object.entries(
      state.SelectedNetworkController.domains,
    )) {
      let newNetworkClientId;

      // Fetch the chain id associated with the domain's network client
      const oldNetworkConfiguration =
        isObject(networkState.networkConfigurations) &&
        typeof networkClientId === 'string'
          ? networkState.networkConfigurations[networkClientId]
          : undefined;

      const chainId = isObject(oldNetworkConfiguration)
        ? oldNetworkConfiguration?.chainId
        : undefined;

      // Fetch the default rpc endpoint associated with that chain id
      if (chainId && typeof chainId === 'string') {
        const networkConfiguration = networkConfigurationsByChainId[chainId];
        if (
          isObject(networkConfiguration) &&
          Array.isArray(networkConfiguration.rpcEndpoints) &&
          typeof networkConfiguration.defaultRpcEndpointIndex === 'number'
        ) {
          newNetworkClientId =
            networkConfiguration.rpcEndpoints[
              networkConfiguration.defaultRpcEndpointIndex
            ].networkClientId;
        }
      }

      // Point the domain to the chain's default rpc endpoint, or remove the
      // entry if the whole chain had to be deleted due to duplicates/invalidity.
      if (newNetworkClientId) {
        state.SelectedNetworkController.domains[domain] = newNetworkClientId;
      } else {
        delete state.SelectedNetworkController.domains[domain];
      }
    }
  }

  state.NetworkController = {
    selectedNetworkClientId,
    networkConfigurationsByChainId,
    networksMetadata: networkState.networksMetadata ?? {},
  };

  // Set `showMultiRpcModal` based on whether there are any networks with multiple rpc endpoints
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    hasProperty(state.PreferencesController, 'preferences') &&
    isObject(state.PreferencesController.preferences)
  ) {
    state.PreferencesController.preferences.showMultiRpcModal = Object.values(
      networkConfigurationsByChainId,
    ).some(
      (networkConfiguration) =>
        isObject(networkConfiguration) &&
        Array.isArray(networkConfiguration.rpcEndpoints) &&
        networkConfiguration.rpcEndpoints.length > 1,
    );
  }

  // Migrate the user's drag + drop preference order for the network menu
  if (
    hasProperty(state, 'NetworkOrderController') &&
    isObject(state.NetworkOrderController) &&
    Array.isArray(state.NetworkOrderController.orderedNetworkList)
  ) {
    // Dedupe the list by chain id, and remove `networkRpcUrl`
    // since it's no longer needed to distinguish networks
    state.NetworkOrderController.orderedNetworkList = [
      ...new Set(
        state.NetworkOrderController.orderedNetworkList.map(
          (network) => network.networkId,
        ),
      ),
    ].map((networkId) => ({ networkId }));
  }

  return state;
}

// Matches network controller validation
function isValidUrl(url: string) {
  const uri = URI.parse(url);
  return (
    uri.error === undefined && (uri.scheme === 'http' || uri.scheme === 'https')
  );
}
