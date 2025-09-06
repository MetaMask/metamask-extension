import { MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19 } from './multichain/assets';
import {
  MULTICHAIN_TOKEN_IMAGE_MAP,
  MultichainNetworks,
} from './multichain/networks';
import {
  ETH_TOKEN_IMAGE_URL,
  TEST_ETH_TOKEN_IMAGE_URL,
  BNB_TOKEN_IMAGE_URL,
  POL_TOKEN_IMAGE_URL,
  AVAX_TOKEN_IMAGE_URL,
  SEI_IMAGE_URL,
  CURRENCY_SYMBOLS,
  CHAIN_IDS,
} from './network';

export const QUOTES_EXPIRED_ERROR = 'quotes-expired';
export const SWAP_FAILED_ERROR = 'swap-failed-error';
export const ERROR_FETCHING_QUOTES = 'error-fetching-quotes';
export const QUOTES_NOT_AVAILABLE_ERROR = 'quotes-not-avilable';
export const CONTRACT_DATA_DISABLED_ERROR = 'contract-data-disabled';
export const OFFLINE_FOR_MAINTENANCE = 'offline-for-maintenance';
export const SWAPS_FETCH_ORDER_CONFLICT = 'swaps-fetch-order-conflict';
export const SLIPPAGE_VERY_HIGH_ERROR = 'slippage-very-high';
export const SLIPPAGE_HIGH_ERROR = 'slippage-high';
export const SLIPPAGE_LOW_ERROR = 'slippage-low';
export const SLIPPAGE_NEGATIVE_ERROR = 'slippage-negative';

export const MAX_ALLOWED_SLIPPAGE = 15;
export const SWAPS_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE = 0.35;

// An address that the metaswap-api recognizes as the default token for the current network,
// in place of the token address that ERC-20 tokens have
const DEFAULT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export type SwapsTokenObject = {
  /**
   * The symbol of token object
   */
  symbol: string;
  /**
   * The name for the network
   */
  name: string;
  /**
   * An address that the metaswap-api recognizes as the default token
   */
  address: string;
  /**
   * Number of digits after decimal point
   */
  decimals: number;
  /**
   * URL for token icon
   */
  iconUrl: string;
};

export const ETH_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.ETH,
  name: 'Ether',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: ETH_TOKEN_IMAGE_URL,
};

export const BNB_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.BNB,
  name: 'Binance Coin',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: BNB_TOKEN_IMAGE_URL,
} as const;

export const MATIC_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.POL,
  name: 'Polygon',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: POL_TOKEN_IMAGE_URL,
} as const;

export const AVAX_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.AVALANCHE,
  name: 'Avalanche',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: AVAX_TOKEN_IMAGE_URL,
} as const;

export const TEST_ETH_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.TEST_ETH,
  name: 'Test Ether',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: TEST_ETH_TOKEN_IMAGE_URL,
} as const;

export const GOERLI_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.ETH,
  name: 'Ether',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: TEST_ETH_TOKEN_IMAGE_URL,
} as const;

export const SEPOLIA_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.ETH,
  name: 'Ether',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: TEST_ETH_TOKEN_IMAGE_URL,
} as const;

export const ARBITRUM_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  ...ETH_SWAPS_TOKEN_OBJECT,
} as const;

export const OPTIMISM_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  ...ETH_SWAPS_TOKEN_OBJECT,
} as const;

export const ZKSYNC_ERA_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  ...ETH_SWAPS_TOKEN_OBJECT,
} as const;

export const LINEA_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  ...ETH_SWAPS_TOKEN_OBJECT,
} as const;

export const BASE_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  ...ETH_SWAPS_TOKEN_OBJECT,
} as const;

export const SEI_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: CURRENCY_SYMBOLS.SEI,
  name: 'Sei',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  // SEI using the same icon as Sei Mainnet
  iconUrl: SEI_IMAGE_URL,
} as const;

const SOLANA_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: 'SOL',
  name: 'Solana',
  address: MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.SOL,
  decimals: 9,
  iconUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.SOLANA],
};

///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
const BITCOIN_SWAPS_TOKEN_OBJECT: SwapsTokenObject = {
  symbol: 'BTC',
  name: 'Bitcoin',
  address: MULTICHAIN_NATIVE_CURRENCY_TO_CAIP19.BTC,
  decimals: 8,
  iconUrl: MULTICHAIN_TOKEN_IMAGE_MAP[MultichainNetworks.BITCOIN],
};
///: END:ONLY_INCLUDE_IF

// A gas value for ERC20 approve calls that should be sufficient for all ERC20 approve implementations
export const DEFAULT_ERC20_APPROVE_GAS = '0x1d4c0';

// Contract addresses below should be in lowercase.
const MAINNET_CONTRACT_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c';
const TESTNET_CONTRACT_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c';
const BSC_CONTRACT_ADDRESS = '0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31';
const POLYGON_CONTRACT_ADDRESS = '0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31';
const AVALANCHE_CONTRACT_ADDRESS = '0x1a1ec25dc08e98e5e93f1104b5e5cdd298707d31';
const OPTIMISM_CONTRACT_ADDRESS = '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6';
const ARBITRUM_CONTRACT_ADDRESS = '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6';
const LINEA_CONTRACT_ADDRESS = '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6';
const ZKSYNC_ERA_CONTRACT_ADDRESS =
  '0xf504c1fe13d14df615e66dcd0abf39e60c697f34';
const BASE_CONTRACT_ADDRESS = '0x9dda6ef3d919c9bc8885d5560999a3640431e8e6';
const SEI_CONTRACT_ADDRESS = '0x962287c9d5B8a682389E61edAE90ec882325d08b';

export const WETH_CONTRACT_ADDRESS =
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';
export const WETH_GOERLI_CONTRACT_ADDRESS =
  '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
export const WBNB_CONTRACT_ADDRESS =
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c';
export const WMATIC_CONTRACT_ADDRESS =
  '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270';
export const WAVAX_CONTRACT_ADDRESS =
  '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7';
export const WETH_OPTIMISM_CONTRACT_ADDRESS =
  '0x4200000000000000000000000000000000000006';
export const WETH_ARBITRUM_CONTRACT_ADDRESS =
  '0x82af49447d8a07e3bd95bd0d56f35241523fbab1';
export const WETH_ZKSYNC_ERA_CONTRACT_ADDRESS =
  '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91';
export const WETH_LINEA_CONTRACT_ADDRESS =
  '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f';
export const WETH_BASE_CONTRACT_ADDRESS =
  '0x4200000000000000000000000000000000000006';
export const WSEI_BASE_CONTRACT_ADDRESS =
  '0xe30fedd158a2e3b13e9badaeabafc5516e95e8c7';

const SWAPS_TESTNET_CHAIN_ID = '0x539';

export const SWAPS_API_V2_BASE_URL = 'https://bridge.api.cx.metamask.io';
export const SWAPS_DEV_API_V2_BASE_URL =
  'https://bridge.dev-api.cx.metamask.io';
export const TOKEN_API_BASE_URL = 'https://tokens.api.cx.metamask.io';
export const GAS_API_BASE_URL = 'https://gas.api.cx.metamask.io';
export const GAS_DEV_API_BASE_URL = 'https://gas.uat-api.cx.metamask.io';

export const ALLOWED_PROD_SWAPS_CHAIN_IDS = [
  CHAIN_IDS.MAINNET,
  SWAPS_TESTNET_CHAIN_ID,
  CHAIN_IDS.BSC,
  CHAIN_IDS.POLYGON,
  CHAIN_IDS.AVALANCHE,
  CHAIN_IDS.OPTIMISM,
  CHAIN_IDS.ARBITRUM,
  CHAIN_IDS.ZKSYNC_ERA,
  CHAIN_IDS.LINEA_MAINNET,
  CHAIN_IDS.BASE,
  CHAIN_IDS.SEI,
  MultichainNetworks.SOLANA,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
  MultichainNetworks.BITCOIN,
  ///: END:ONLY_INCLUDE_IF
] as const;

export const ALLOWED_DEV_SWAPS_CHAIN_IDS = [
  ...ALLOWED_PROD_SWAPS_CHAIN_IDS,
  CHAIN_IDS.GOERLI,
] as const;

export const ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.GOERLI,
] as const;

export const SWAPS_CHAINID_CONTRACT_ADDRESS_MAP = {
  [CHAIN_IDS.MAINNET]: MAINNET_CONTRACT_ADDRESS,
  [SWAPS_TESTNET_CHAIN_ID]: TESTNET_CONTRACT_ADDRESS,
  [CHAIN_IDS.BSC]: BSC_CONTRACT_ADDRESS,
  [CHAIN_IDS.POLYGON]: POLYGON_CONTRACT_ADDRESS,
  [CHAIN_IDS.GOERLI]: TESTNET_CONTRACT_ADDRESS,
  [CHAIN_IDS.AVALANCHE]: AVALANCHE_CONTRACT_ADDRESS,
  [CHAIN_IDS.OPTIMISM]: OPTIMISM_CONTRACT_ADDRESS,
  [CHAIN_IDS.ARBITRUM]: ARBITRUM_CONTRACT_ADDRESS,
  [CHAIN_IDS.ZKSYNC_ERA]: ZKSYNC_ERA_CONTRACT_ADDRESS,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_CONTRACT_ADDRESS,
  [CHAIN_IDS.BASE]: BASE_CONTRACT_ADDRESS,
  [CHAIN_IDS.SEI]: SEI_CONTRACT_ADDRESS,
} as const;

export const SWAPS_WRAPPED_TOKENS_ADDRESSES = {
  [CHAIN_IDS.MAINNET]: WETH_CONTRACT_ADDRESS,
  [SWAPS_TESTNET_CHAIN_ID]: WETH_CONTRACT_ADDRESS,
  [CHAIN_IDS.BSC]: WBNB_CONTRACT_ADDRESS,
  [CHAIN_IDS.POLYGON]: WMATIC_CONTRACT_ADDRESS,
  [CHAIN_IDS.GOERLI]: WETH_GOERLI_CONTRACT_ADDRESS,
  [CHAIN_IDS.AVALANCHE]: WAVAX_CONTRACT_ADDRESS,
  [CHAIN_IDS.OPTIMISM]: WETH_OPTIMISM_CONTRACT_ADDRESS,
  [CHAIN_IDS.ARBITRUM]: WETH_ARBITRUM_CONTRACT_ADDRESS,
  [CHAIN_IDS.ZKSYNC_ERA]: WETH_ZKSYNC_ERA_CONTRACT_ADDRESS,
  [CHAIN_IDS.LINEA_MAINNET]: WETH_LINEA_CONTRACT_ADDRESS,
  [CHAIN_IDS.BASE]: WETH_BASE_CONTRACT_ADDRESS,
  [CHAIN_IDS.SEI]: WSEI_BASE_CONTRACT_ADDRESS,
} as const;

export const ALLOWED_CONTRACT_ADDRESSES = {
  [CHAIN_IDS.MAINNET]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.MAINNET],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.MAINNET],
  ],
  [SWAPS_TESTNET_CHAIN_ID]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[SWAPS_TESTNET_CHAIN_ID],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[SWAPS_TESTNET_CHAIN_ID],
  ],
  [CHAIN_IDS.GOERLI]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.GOERLI],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.GOERLI],
  ],
  [CHAIN_IDS.BSC]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.BSC],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.BSC],
  ],
  [CHAIN_IDS.POLYGON]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.POLYGON],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.POLYGON],
  ],
  [CHAIN_IDS.AVALANCHE]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.AVALANCHE],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.AVALANCHE],
  ],
  [CHAIN_IDS.OPTIMISM]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.OPTIMISM],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.OPTIMISM],
  ],
  [CHAIN_IDS.ARBITRUM]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.ARBITRUM],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.ARBITRUM],
  ],
  [CHAIN_IDS.ZKSYNC_ERA]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.ZKSYNC_ERA],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.ZKSYNC_ERA],
  ],
  [CHAIN_IDS.LINEA_MAINNET]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.LINEA_MAINNET],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.LINEA_MAINNET],
  ],
  [CHAIN_IDS.BASE]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.BASE],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.BASE],
  ],
  [CHAIN_IDS.SEI]: [
    SWAPS_CHAINID_CONTRACT_ADDRESS_MAP[CHAIN_IDS.SEI],
    SWAPS_WRAPPED_TOKENS_ADDRESSES[CHAIN_IDS.SEI],
  ],
} as const;

export const SWAPS_CHAINID_DEFAULT_TOKEN_MAP = {
  [CHAIN_IDS.MAINNET]: ETH_SWAPS_TOKEN_OBJECT,
  [SWAPS_TESTNET_CHAIN_ID]: TEST_ETH_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.BSC]: BNB_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.POLYGON]: MATIC_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.GOERLI]: GOERLI_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.SEPOLIA]: GOERLI_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.AVALANCHE]: AVAX_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.OPTIMISM]: OPTIMISM_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.ARBITRUM]: ARBITRUM_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.ZKSYNC_ERA]: ZKSYNC_ERA_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.BASE]: BASE_SWAPS_TOKEN_OBJECT,
  [CHAIN_IDS.SEI]: SEI_SWAPS_TOKEN_OBJECT,
  [MultichainNetworks.SOLANA]: SOLANA_SWAPS_TOKEN_OBJECT,
  ///: BEGIN:ONLY_INCLUDE_IF(bitcoin-swaps)
  [MultichainNetworks.BITCOIN]: BITCOIN_SWAPS_TOKEN_OBJECT,
  ///: END:ONLY_INCLUDE_IF
} as const;

export const ETHEREUM = 'ethereum';
export const POLYGON = 'polygon';
export const BSC = 'bsc';
export const GOERLI = 'goerli';
export const AVALANCHE = 'avalanche';
export const OPTIMISM = 'optimism';
export const ARBITRUM = 'arbitrum';
export const ZKSYNC_ERA = 'zksync';
export const LINEA = 'linea';
export const BASE = 'base';
export const SEI = 'sei';

export const SWAPS_CLIENT_ID = 'extension';

export enum TokenBucketPriority {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  owned = 'owned',
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  top = 'top',
}

export enum Slippage {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  default = 2,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  high = 3,
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  stable = 0.5,
}

const ETH_USDC_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDC,
  name: 'USD Coin',
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png',
};

const BSC_USDT_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDT,
  name: 'Tether USD',
  address: '0x55d398326f99059ff775485246999027b3197955',
  decimals: 18,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/56/0x55d398326f99059ff775485246999027b3197955.png',
};

const POLYGON_USDT_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDT,
  name: 'Tether USD',
  address: '0xc2132d05d31c914a87c6611c10748aeb04b58e8f',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/137/0xc2132d05d31c914a87c6611c10748aeb04b58e8f.png',
};

const ARBITRUM_USDC_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDC,
  name: 'USD Coin',
  address: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/42161/0xaf88d065e77c8cc2239327c5edb3a432268e5831.png',
};

const AVALANCHE_USDC_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDC,
  name: 'USD Coin',
  address: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/43114/0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e.png',
};

const OPTIMISM_WETH_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.WETH,
  name: 'Wrapped Ether',
  address: '0x4200000000000000000000000000000000000006',
  decimals: 18,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/10/0x4200000000000000000000000000000000000006.png',
};

const BASE_USDC_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDC,
  name: 'USD Coin',
  address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/8453/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.png',
};

const LINEA_USDC_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDC,
  name: 'USD Coin',
  address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/59144/0x176211869ca2b568f2a7d4ee941e073a821ee1ff.png',
};

const ZKSYNC_USDT_TOKEN_OBJECT = {
  symbol: CURRENCY_SYMBOLS.USDT,
  name: 'USD Coin',
  address: '0x493257fd37edb34451f62edf8d2a0c418852ba4c',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v1/tokenIcons/324/0x493257fd37edb34451f62edf8d2a0c418852ba4c.png',
};

const SOLANA_USDC_TOKEN_OBJECT = {
  address:
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  iconUrl:
    'https://static.cx.metamask.io/api/v2/tokenIcons/assets/solana/5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v.png',
};

/**
 * The most common token pair for each chain
 * ex: for mainnet, the main token is ETH and the most common swap is USDC
 */
export const SWAPS_CHAINID_COMMON_TOKEN_PAIR = {
  [CHAIN_IDS.MAINNET]: ETH_USDC_TOKEN_OBJECT,
  [CHAIN_IDS.BSC]: BSC_USDT_TOKEN_OBJECT,
  [CHAIN_IDS.POLYGON]: POLYGON_USDT_TOKEN_OBJECT,
  [CHAIN_IDS.ARBITRUM]: ARBITRUM_USDC_TOKEN_OBJECT,
  [CHAIN_IDS.AVALANCHE]: AVALANCHE_USDC_TOKEN_OBJECT,
  [CHAIN_IDS.OPTIMISM]: OPTIMISM_WETH_TOKEN_OBJECT,
  [CHAIN_IDS.BASE]: BASE_USDC_TOKEN_OBJECT,
  [CHAIN_IDS.LINEA_MAINNET]: LINEA_USDC_TOKEN_OBJECT,
  [CHAIN_IDS.ZKSYNC_ERA]: ZKSYNC_USDT_TOKEN_OBJECT,
  [MultichainNetworks.SOLANA]: SOLANA_USDC_TOKEN_OBJECT,
};

export const STABLE_PAIRS: Record<string, boolean> = {
  [CURRENCY_SYMBOLS.USDC]: true,
  [CURRENCY_SYMBOLS.USDT]: true,
};

export function isStablePair(
  sourceSymbol: string,
  destinationSymbol: string,
): boolean {
  return STABLE_PAIRS[sourceSymbol] && STABLE_PAIRS[destinationSymbol];
}

/**
 * A map of chain IDs to sets of known stablecoin contract addresses with deep liquidity.
 * Used to determine if a pair qualifies for lower default slippage to avoid frontrunning.
 * Just using USDC and USDT for now, but can add more as needed.
 */
export const StablecoinsByChainId: Partial<Record<string, Set<string>>> = {
  [CHAIN_IDS.MAINNET]: new Set([
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
    '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  ]),
  [CHAIN_IDS.LINEA_MAINNET]: new Set([
    '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // USDC
    '0xA219439258ca9da29E9Cc4cE5596924745e12B93', // USDT
  ]),
  [CHAIN_IDS.POLYGON]: new Set([
    '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174', // USDC.e
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f', // USDT
  ]),
  [CHAIN_IDS.ARBITRUM]: new Set([
    '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8', // USDC.e
    '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT
  ]),
  [CHAIN_IDS.BASE]: new Set([
    '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  ]),
  [CHAIN_IDS.OPTIMISM]: new Set([
    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
    '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC.e
    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
  ]),
  [CHAIN_IDS.BSC]: new Set([
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
    '0x55d398326f99059ff775485246999027b3197955', // USDT
  ]),
  [CHAIN_IDS.AVALANCHE]: new Set([
    '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e', // USDC
    '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664', // USDC.e
    '0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7', // USDT
    '0xc7198437980c041c805a1edcba50c1ce5db95118', // USDT.e
  ]),
  [CHAIN_IDS.ZKSYNC_ERA]: new Set([
    '0x1d17CBcF0D6D143135aE902365D2E5e2A16538D4', // USDC
    '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', // USDC.e
    '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // USDT
  ]),
  [CHAIN_IDS.SEI]: new Set([
    '0x3894085Ef7Ff0f0aeDf52E2A2704928d1Ec074F1', // USDC
  ]),
};
