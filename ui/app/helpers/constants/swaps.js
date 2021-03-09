// An address that the metaswap-api recognizes as ETH, in place of the token address that ERC-20 tokens have
const ETH_SWAPS_TOKEN_ADDRESS = '0x0000000000000000000000000000000000000000';

export const ETH_SWAPS_TOKEN_OBJECT = {
  symbol: 'ETH',
  name: 'Ether',
  address: ETH_SWAPS_TOKEN_ADDRESS,
  decimals: 18,
  iconUrl: 'images/black-eth-logo.svg',
};

export const QUOTES_EXPIRED_ERROR = 'quotes-expired';
export const SWAP_FAILED_ERROR = 'swap-failed-error';
export const ERROR_FETCHING_QUOTES = 'error-fetching-quotes';
export const QUOTES_NOT_AVAILABLE_ERROR = 'quotes-not-avilable';
export const OFFLINE_FOR_MAINTENANCE = 'offline-for-maintenance';
export const SWAPS_FETCH_ORDER_CONFLICT = 'swaps-fetch-order-conflict';

// A gas value for ERC20 approve calls that should be sufficient for all ERC20 approve implementations
export const DEFAULT_ERC20_APPROVE_GAS = '0x1d4c0';

export const SWAPS_CONTRACT_ADDRESS =
  '0x881d40237659c251811cec9c364ef91dc08d300c';
