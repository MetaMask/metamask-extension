import { CHAIN_IDS } from '../constants/network';

enum NetworkName {
  Ethereum = 'ethereum',
  Polygon = 'polygon',
  Bsc = 'bsc',
  Avalanche = 'avalanche',
  Optimism = 'optimism',
  Arbitrum = 'arbitrum',
  ZkSyncEra = 'zksync',
  Linea = 'linea',
}

/**
 * @param chainId
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getNetworkNameByChainId = (chainId: string): string => {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
    case CHAIN_IDS.GOERLI:
    case CHAIN_IDS.SEPOLIA:
      return NetworkName.Ethereum;
    case CHAIN_IDS.BSC:
      return NetworkName.Bsc;
    case CHAIN_IDS.POLYGON:
      return NetworkName.Polygon;
    case CHAIN_IDS.AVALANCHE:
      return NetworkName.Avalanche;
    case CHAIN_IDS.OPTIMISM:
      return NetworkName.Optimism;
    case CHAIN_IDS.ARBITRUM:
      return NetworkName.Arbitrum;
    case CHAIN_IDS.ZKSYNC_ERA:
      return NetworkName.ZkSyncEra;
    case CHAIN_IDS.LINEA_MAINNET:
      return NetworkName.Linea;
    default:
      return '';
  }
};
