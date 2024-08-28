import {
  NetworkMetadata,
  NetworkState,
  NetworkStatus,
} from '@metamask/network-controller';
import { v4 as uuidv4 } from 'uuid';
import { Hex } from '@metamask/utils';
import {
  NETWORK_TO_NAME_MAP,
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
} from '../../shared/constants/network';

export const mockNetworkState = (
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
): NetworkState => {
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
