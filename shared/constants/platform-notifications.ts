import { CHAIN_IDS, CHAINLIST_CURRENCY_SYMBOLS_MAP } from './network';

export enum TRIGGER_TYPES {
  FEATURES_ANNOUNCEMENT = 'features_announcement',
  METAMASK_SWAP_COMPLETED = 'metamask_swap_completed',
  ERC20_SENT = 'erc20_sent',
  ERC20_RECEIVED = 'erc20_received',
  ETH_SENT = 'eth_sent',
  ETH_RECEIVED = 'eth_received',
  ROCKETPOOL_STAKE_COMPLETED = 'rocketpool_stake_completed',
  ROCKETPOOL_UNSTAKE_COMPLETED = 'rocketpool_unstake_completed',
  LIDO_STAKE_COMPLETED = 'lido_stake_completed',
  LIDO_WITHDRAWAL_REQUESTED = 'lido_withdrawal_requested',
  LIDO_WITHDRAWAL_COMPLETED = 'lido_withdrawal_completed',
  LIDO_STAKE_READY_TO_BE_WITHDRAWN = 'lido_stake_ready_to_be_withdrawn',
  ERC721_SENT = 'erc721_sent',
  ERC721_RECEIVED = 'erc721_received',
  ERC1155_SENT = 'erc1155_sent',
  ERC1155_RECEIVED = 'erc1155_received',
}

const chains = {
  MAINNET: `${parseInt(CHAIN_IDS.MAINNET, 16)}`,
  OPTIMISM: `${parseInt(CHAIN_IDS.OPTIMISM, 16)}`,
  BSC: `${parseInt(CHAIN_IDS.BSC, 16)}`,
  POLYGON: `${parseInt(CHAIN_IDS.POLYGON, 16)}`,
  ARBITRUM: `${parseInt(CHAIN_IDS.ARBITRUM, 16)}`,
  AVALANCHE: `${parseInt(CHAIN_IDS.AVALANCHE, 16)}`,
  LINEA: `${parseInt(CHAIN_IDS.LINEA_MAINNET, 16)}`,
};

export const SUPPORTED_CHAINS = [
  chains.MAINNET,
  chains.OPTIMISM,
  chains.BSC,
  chains.POLYGON,
  chains.ARBITRUM,
  chains.AVALANCHE,
  chains.LINEA,
];

export type Trigger = {
  supported_chains: (typeof SUPPORTED_CHAINS)[number][];
};

export const TRIGGERS: Partial<Record<TRIGGER_TYPES, Trigger>> = {
  [TRIGGER_TYPES.METAMASK_SWAP_COMPLETED]: {
    supported_chains: [
      chains.MAINNET,
      chains.OPTIMISM,
      chains.BSC,
      chains.POLYGON,
      chains.ARBITRUM,
      chains.AVALANCHE,
    ],
  },
  [TRIGGER_TYPES.ERC20_SENT]: {
    supported_chains: [
      chains.MAINNET,
      chains.OPTIMISM,
      chains.BSC,
      chains.POLYGON,
      chains.ARBITRUM,
      chains.AVALANCHE,
      chains.LINEA,
    ],
  },
  [TRIGGER_TYPES.ERC20_RECEIVED]: {
    supported_chains: [
      chains.MAINNET,
      chains.OPTIMISM,
      chains.BSC,
      chains.POLYGON,
      chains.ARBITRUM,
      chains.AVALANCHE,
      chains.LINEA,
    ],
  },
  [TRIGGER_TYPES.ERC721_SENT]: {
    supported_chains: [chains.MAINNET, chains.POLYGON],
  },
  [TRIGGER_TYPES.ERC721_RECEIVED]: {
    supported_chains: [chains.MAINNET, chains.POLYGON],
  },
  [TRIGGER_TYPES.ERC1155_SENT]: {
    supported_chains: [chains.MAINNET, chains.POLYGON],
  },
  [TRIGGER_TYPES.ERC1155_RECEIVED]: {
    supported_chains: [chains.MAINNET, chains.POLYGON],
  },
  [TRIGGER_TYPES.ETH_SENT]: {
    supported_chains: [
      chains.MAINNET,
      chains.OPTIMISM,
      chains.BSC,
      chains.POLYGON,
      chains.ARBITRUM,
      chains.AVALANCHE,
      chains.LINEA,
    ],
  },
  [TRIGGER_TYPES.ETH_RECEIVED]: {
    supported_chains: [
      chains.MAINNET,
      chains.OPTIMISM,
      chains.BSC,
      chains.POLYGON,
      chains.ARBITRUM,
      chains.AVALANCHE,
      chains.LINEA,
    ],
  },
  [TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED]: {
    supported_chains: [chains.MAINNET],
  },
  [TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED]: {
    supported_chains: [chains.MAINNET],
  },
  [TRIGGER_TYPES.LIDO_STAKE_COMPLETED]: {
    supported_chains: [chains.MAINNET],
  },
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED]: {
    supported_chains: [chains.MAINNET],
  },
  [TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED]: {
    supported_chains: [chains.MAINNET],
  },
};

export enum TRIGGER_DATA_TYPES {
  DATA_FEATURE_ANNOUNCEMENT = 'data_feature_announcement',
  DATA_METAMASK_SWAP_COMPLETED = 'data_metamask_swap_completed',
  DATA_STAKE = 'data_stake',
  DATA_LIDO_STAKE_READY_TO_BE_WITHDRAWN = 'data_lido_stake_ready_to_be_withdrawn',
  DATA_ETH = 'data_eth',
  DATA_ERC20 = 'data_erc20',
  DATA_ERC721 = 'data_erc721',
  DATA_ERC1155 = 'data_erc1155',
}

export const CHAIN_SYMBOLS = {
  [CHAIN_IDS.MAINNET]: CHAINLIST_CURRENCY_SYMBOLS_MAP.ETH,
  [CHAIN_IDS.OPTIMISM]: CHAINLIST_CURRENCY_SYMBOLS_MAP.OPTIMISM,
  [CHAIN_IDS.BSC]: CHAINLIST_CURRENCY_SYMBOLS_MAP.BNB,
  [CHAIN_IDS.POLYGON]: CHAINLIST_CURRENCY_SYMBOLS_MAP.MATIC,
  [CHAIN_IDS.ARBITRUM]: CHAINLIST_CURRENCY_SYMBOLS_MAP.ARBITRUM,
  [CHAIN_IDS.AVALANCHE]: CHAINLIST_CURRENCY_SYMBOLS_MAP.AVALANCHE,
  [CHAIN_IDS.LINEA_MAINNET]: CHAINLIST_CURRENCY_SYMBOLS_MAP.LINEA_MAINNET,
};
