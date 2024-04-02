import { SECOND } from './time';

import { CHAIN_IDS } from './network';

export const FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME = SECOND * 10;
export const FALLBACK_SMART_TRANSACTIONS_DEADLINE = 180;
export const FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER = 2;

export const ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.GOERLI,
  CHAIN_IDS.SEPOLIA,
];

export const StxErrorTypes = {
  unavailable: 'unavailable',
  notEnoughFunds: 'not_enough_funds',
  regularTxPending: 'regular_tx_pending',
};
