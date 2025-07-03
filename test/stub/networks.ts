import {
  NetworkMetadata,
  NetworkState,
  NetworkStatus,
  RpcEndpointType,
} from '@metamask/network-controller';
import { type MultichainNetworkControllerState } from '@metamask/multichain-network-controller';
import { v4 as uuidv4 } from 'uuid';
import { Hex } from '@metamask/utils';
import { BtcScope, SolScope } from '@metamask/keyring-api';
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

export const mockMultichainNetworkState =
  (): MultichainNetworkControllerState => {
    return {
      multichainNetworkConfigurationsByChainId: {
        [BtcScope.Mainnet]: {
          chainId: BtcScope.Mainnet,
          name: 'Bitcoin',
          nativeCurrency: `${BtcScope.Mainnet}/slip44:0`,
          isEvm: false,
        },
        [SolScope.Mainnet]: {
          chainId: SolScope.Mainnet,
          name: 'Solana',
          nativeCurrency: `${SolScope.Mainnet}/slip44:501`,
          isEvm: false,
        },
      },
      selectedMultichainNetworkChainId: BtcScope.Mainnet,
      isEvmSelected: true,
      networksWithTransactionActivity: {
        '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': {
          namespace: 'eip155',
          activeChains: ['0x5'],
        },
      },
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
        ? (network.blockExplorerUrl ??
          `https://localhost/blockExplorer/${network.chainId}`)
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

/**
 * Creates a mock network state with domains property for tests that need it.
 * This is a helper for tests that spread mockNetworkState into their metamask state
 * and need the domains property to be present.
 *
 * @param overrides - Optional overrides for the network configuration
 * @param overrides.id - Network ID override
 * @param overrides.chainId - Chain ID override (required if provided)
 * @param overrides.rpcUrl - RPC URL override
 * @param overrides.nickname - Network nickname override
 * @param overrides.ticker - Network ticker override
 * @param overrides.blockExplorerUrl - Block explorer URL override
 * @param overrides.metadata - Network metadata override
 * @returns Network state with domains property
 */
export function mockNetworkStateWithDomains(
  overrides: {
    id?: string;
    chainId: `0x${string}`;
    rpcUrl?: string;
    nickname?: string;
    ticker?: string;
    blockExplorerUrl?: string;
    metadata?: NetworkMetadata;
  } = { chainId: '0x1' },
): NetworkState & { domains: Record<string, string> } {
  return {
    ...mockNetworkState(overrides),
    domains: {},
  };
}

/**
 * Creates a mock metamask state that includes network state and domains.
 * This is the recommended helper for tests that need a complete metamask state.
 *
 * @param networkOverrides - Optional network configuration overrides
 * @param networkOverrides.id - Network ID override
 * @param networkOverrides.chainId - Chain ID override
 * @param networkOverrides.rpcUrl - RPC URL override
 * @param networkOverrides.nickname - Network nickname override
 * @param networkOverrides.ticker - Network ticker override
 * @param networkOverrides.blockExplorerUrl - Block explorer URL override
 * @param networkOverrides.metadata - Network metadata override
 * @param additionalState - Additional metamask state properties to include
 * @returns Metamask state with network configuration and domains
 */
export function createMockMetamaskState(
  networkOverrides: {
    id?: string;
    chainId: `0x${string}`;
    rpcUrl?: string;
    nickname?: string;
    ticker?: string;
    blockExplorerUrl?: string;
    metadata?: NetworkMetadata;
  } = { chainId: '0x1' },
  additionalState: Record<string, unknown> = {},
) {
  return {
    ...mockNetworkState(networkOverrides),
    domains: {},
    ...additionalState,
  };
}
