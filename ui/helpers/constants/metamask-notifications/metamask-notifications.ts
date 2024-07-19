import { CHAIN_IDS } from '../../../../shared/constants/network';

export type BlockExplorerConfig = {
  url: string;
  name: string;
};

/**
 * Map of all supported block explorers.
 */
export const SUPPORTED_NOTIFICATION_BLOCK_EXPLORERS = {
  // ETHEREUM
  [CHAIN_IDS.MAINNET]: {
    url: 'https://etherscan.io',
    name: 'Etherscan',
  },
  // OPTIMISM
  [CHAIN_IDS.OPTIMISM]: {
    url: 'https://optimistic.etherscan.io',
    name: 'Optimistic Etherscan',
  },
  // BSC
  [CHAIN_IDS.BSC]: {
    url: 'https://bscscan.com',
    name: 'BscScan',
  },
  // POLYGON
  [CHAIN_IDS.POLYGON]: {
    url: 'https://polygonscan.com',
    name: 'PolygonScan',
  },
  // ARBITRUM
  [CHAIN_IDS.ARBITRUM]: {
    url: 'https://arbiscan.io',
    name: 'Arbiscan',
  },
  // AVALANCHE
  [CHAIN_IDS.AVALANCHE]: {
    url: 'https://snowtrace.io',
    name: 'Snowtrace',
  },
  // LINEA
  [CHAIN_IDS.LINEA_MAINNET]: {
    url: 'https://lineascan.build',
    name: 'LineaScan',
  },
};
