import { MAINNET_CHAIN_ID } from './network';

export const QUOTES_EXPIRED_ERROR = 'quotes-expired';
export const SWAP_FAILED_ERROR = 'swap-failed-error';
export const ERROR_FETCHING_QUOTES = 'error-fetching-quotes';
export const QUOTES_NOT_AVAILABLE_ERROR = 'quotes-not-avilable';
export const OFFLINE_FOR_MAINTENANCE = 'offline-for-maintenance';
export const SWAPS_FETCH_ORDER_CONFLICT = 'swaps-fetch-order-conflict';

// An address that the metaswap-api recognizes as the default token for the current network, in place of the token address that ERC-20 tokens have
const DEFAULT_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ETH_SWAPS_TOKEN_OBJECT = {
  symbol: 'ETH',
  name: 'Ether',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: 'images/black-eth-logo.svg',
};

const BNB_SWAPS_TOKEN_OBJECT = {
  symbol: 'BNB',
  name: 'Binance Coin',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: 'images/bnb.png',
};

const TEST_ETH_SWAPS_TOKEN_OBJECT = {
  symbol: 'TESTETH',
  name: 'Test Ether',
  address: DEFAULT_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: 'images/black-eth-logo.svg',
};

// A gas value for ERC20 approve calls that should be sufficient for all ERC20 approve implementations
export const DEFAULT_ERC20_APPROVE_GAS = '0x1d4c0';

const MAINNET_CONTRACT_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c';

const TESTNET_CONTRACT_ADDRESS = '0x881d40237659c251811cec9c364ef91dc08d300c';

const BSC_CONTRACT_ADDRESS = '0x1a1ec25DC08e98e5E93F1104B5e5cdD298707d31';

const METASWAP_ETH_API_HOST = 'https://api.metaswap.codefi.network';

const METASWAP_BNB_API_HOST = 'https://bsc-api.metaswap.codefi.network';
const BNB_CHAIN_ID = '0x38';

const SWAPS_TESTNET_CHAIN_ID = '0x539';
const SWAPS_TESTNET_HOST = 'https://metaswap-api.airswap-dev.codefi.network';

const BSC_DEFAULT_BLOCK_EXPLORER_URL = 'https://bscscan.com/';

export const ALLOWED_SWAPS_CHAIN_IDS = {
  [MAINNET_CHAIN_ID]: true,
  [SWAPS_TESTNET_CHAIN_ID]: true,
  [BNB_CHAIN_ID]: true,
};

export const METASWAP_CHAINID_API_HOST_MAP = {
  [MAINNET_CHAIN_ID]: METASWAP_ETH_API_HOST,
  [SWAPS_TESTNET_CHAIN_ID]: SWAPS_TESTNET_HOST,
  [BNB_CHAIN_ID]: METASWAP_BNB_API_HOST,
};

export const SWAPS_CHAINID_CONTRACT_ADDRESS_MAP = {
  [MAINNET_CHAIN_ID]: MAINNET_CONTRACT_ADDRESS,
  [SWAPS_TESTNET_CHAIN_ID]: TESTNET_CONTRACT_ADDRESS,
  [BNB_CHAIN_ID]: BSC_CONTRACT_ADDRESS,
};

export const SWAPS_CHAINID_DEFAULT_TOKEN_MAP = {
  [MAINNET_CHAIN_ID]: ETH_SWAPS_TOKEN_OBJECT,
  [SWAPS_TESTNET_CHAIN_ID]: TEST_ETH_SWAPS_TOKEN_OBJECT,
  [BNB_CHAIN_ID]: BNB_SWAPS_TOKEN_OBJECT,
};

export const SWAPS_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP = {
  [BNB_CHAIN_ID]: BSC_DEFAULT_BLOCK_EXPLORER_URL,
};
