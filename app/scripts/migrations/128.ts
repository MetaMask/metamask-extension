import { hasProperty, isObject, RuntimeObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
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

export const version = 128;

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

    // Calculate the unique set of rpc endpoints
    const rpcEndpoints = networks.reduce(
      (endpoints: RuntimeObject[], network) => {
        if (
          network.id &&
          network.rpcUrl &&
          !endpoints.some(
            (endpoint) =>
              endpoint.url === network.rpcUrl ||
              endpoint.networkClientId === network.id,
          )
        ) {
          endpoints.push({
            networkClientId: network.id,
            url: network.rpcUrl,
            type: network.type === 'infura' ? 'infura' : 'custom',
            ...(network.type !== 'infura' &&
              typeof network.nickname === 'string' &&
              network.nickname && { name: network.nickname }),
          });
        }
        return endpoints;
      },
      [],
    );

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

  state.NetworkController = {
    // This should already be defined, but default to mainnet just in case
    selectedNetworkClientId: networkState.selectedNetworkClientId ?? 'mainnet',
    networkConfigurationsByChainId,
    networksMetadata: networkState.networksMetadata ?? {},
  };

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
