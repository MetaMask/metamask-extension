import {
  NetworkMetadata,
  NetworkState,
  NetworkStatus,
  RpcEndpointType,
} from '@metamask/network-controller';
import { v4 as uuidv4 } from 'uuid';
import { Hex } from '@metamask/utils';
import {
  NETWORK_TO_NAME_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
} from '../../shared/constants/network';

// TODO: This is intentionally the old network state, and could be
// removed if the e2e tests bump `FIXTURE_STATE_METADATA_VERSION` to >= 127
export const mockNetworkStateOld = (
  ...networks: {
    id?: string;
    type?: string;
    chainId: Hex;
    rpcUrl?: string;
    nickname?: string;
    ticker?: string;
    blockExplorerUrl?: string;
    metadata?: NetworkMetadata;
  }[]
) => {
  const networkConfigurations = networks.map((network) => ({
    id: network.id ?? uuidv4(),
    chainId: network.chainId,
    rpcUrl:
      'rpcUrl' in network
        ? network.rpcUrl
        : `https://localhost/rpc/${network.chainId}`,
    nickname:
      'nickname' in network
        ? network.nickname
        : (NETWORK_TO_NAME_MAP as Record<Hex, string>)[network.chainId],
    ticker:
      'ticker' in network
        ? network.ticker
        : (CHAIN_ID_TO_CURRENCY_SYMBOL_MAP as Record<Hex, string>)[
            network.chainId
          ],
    ...((!('blockExplorerUrl' in network) || network.blockExplorerUrl) && {
      rpcPrefs: {
        blockExplorerUrl:
          network.blockExplorerUrl ??
          `https://localhost/blockExplorer/${network.chainId}`,
      },
    }),
  }));

  const networksMetadata = networks.reduce(
    (acc, network, i) => ({
      ...acc,
      [networkConfigurations[i].id]: network.metadata ?? {
        EIPS: {},
        status: NetworkStatus.Available,
      },
    }),
    {},
  );

  return {
    selectedNetworkClientId: networkConfigurations[0].id,
    networkConfigurations: networkConfigurations.reduce(
      (acc, network) => ({ ...acc, [network.id]: network }),
      {},
    ),
    networksMetadata,
  };
};

export const mockNetworkState = (
  ...networks: {
    id?: string;
    chainId: Hex;
    rpcUrl?: string;
    nickname?: string;
    ticker?: string;
    blockExplorerUrl?: string;
    metadata?: NetworkMetadata;
  }[]
): NetworkState => {
  if (
    new Set(networks.map((network) => network.chainId)).size !== networks.length
  ) {
    throw 'mockNetworkState doesnt currently support multiple rpc urls per chain id';
  }

  const networkConfigurations = networks.map((network) => {
    const blockExplorer =
      !('blockExplorerUrl' in network) || network.blockExplorerUrl
        ? network.blockExplorerUrl ??
          `https://localhost/blockExplorer/${network.chainId}`
        : undefined;

    const rpc =
      'rpcUrl' in network
        ? network.rpcUrl
        : `https://localhost/rpc/${network.chainId}`;

    return {
      chainId: network.chainId,
      blockExplorerUrls: blockExplorer ? [blockExplorer] : [],
      defaultBlockExplorerUrlIndex: blockExplorer ? 0 : undefined,
      rpcEndpoints: [
        {
          networkClientId: network.id ?? uuidv4(),
          type: RpcEndpointType.Custom,
          url: rpc,
        },
      ],
      defaultRpcEndpointIndex: 0,
      name:
        'nickname' in network
          ? network.nickname
          : (NETWORK_TO_NAME_MAP as Record<Hex, string>)[network.chainId],
      nativeCurrency:
        'ticker' in network
          ? network.ticker
          : (CHAIN_ID_TO_CURRENCY_SYMBOL_MAP as Record<Hex, string>)[
              network.chainId
            ],
    };
  });

  const networksMetadata = networks.reduce(
    (acc, network, i) => ({
      ...acc,
      [networkConfigurations[i].rpcEndpoints[0].networkClientId]:
        network.metadata ?? {
          EIPS: {},
          status: NetworkStatus.Available,
        },
    }),
    {},
  );

  return {
    selectedNetworkClientId:
      networkConfigurations[0].rpcEndpoints[0].networkClientId,
    networkConfigurationsByChainId: networkConfigurations.reduce(
      (acc, network) => ({ ...acc, [network.chainId]: network }),
      {},
    ),
    networksMetadata,
  };
};
