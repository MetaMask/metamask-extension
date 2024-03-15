import { SECOND } from './time';

import { CHAIN_IDS } from './network';

export const FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME: number = SECOND * 10;
export const FALLBACK_SMART_TRANSACTIONS_DEADLINE: number = 180;
export const FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER: number = 2;

export const ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS: string[] = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.SEPOLIA,
];

export const SKIP_STX_RPC_URL_CHECK_CHAIN_IDS: string[] = [CHAIN_IDS.SEPOLIA];
