import { CHAIN_IDS } from '../constants/network';

export const ETHEREUM = 'ethereum';
export const POLYGON = 'polygon';
export const BSC = 'bsc';
export const GOERLI = 'goerli';
export const AVALANCHE = 'avalanche';
export const OPTIMISM = 'optimism';
export const ARBITRUM = 'arbitrum';
export const ZKSYNC_ERA = 'zksync';
export const LINEA = 'linea';

/**
 * @param chainId
 * @returns string e.g. ethereum, bsc or polygon
 */
export const getNetworkNameByChainId = (chainId: string): string => {
  switch (chainId) {
    case CHAIN_IDS.MAINNET:
    case CHAIN_IDS.GOERLI:
    case CHAIN_IDS.SEPOLIA:
      return ETHEREUM;
    case CHAIN_IDS.BSC:
      return BSC;
    case CHAIN_IDS.POLYGON:
      return POLYGON;
    case CHAIN_IDS.GOERLI:
      return GOERLI;
    case CHAIN_IDS.AVALANCHE:
      return AVALANCHE;
    case CHAIN_IDS.OPTIMISM:
      return OPTIMISM;
    case CHAIN_IDS.ARBITRUM:
      return ARBITRUM;
    case CHAIN_IDS.ZKSYNC_ERA:
      return ZKSYNC_ERA;
    case CHAIN_IDS.LINEA_MAINNET:
      return LINEA;
    default:
      return '';
  }
};