import { isProduction } from '../modules/environment';
import { SECOND } from './time';
import { CHAIN_IDS } from './network';

export const FALLBACK_SMART_TRANSACTIONS_REFRESH_TIME: number = SECOND * 10;
export const FALLBACK_SMART_TRANSACTIONS_DEADLINE: number = 180;
export const FALLBACK_SMART_TRANSACTIONS_EXPECTED_DEADLINE = 45;
export const FALLBACK_SMART_TRANSACTIONS_MAX_DEADLINE = 150;
export const FALLBACK_SMART_TRANSACTIONS_MAX_FEE_MULTIPLIER: number = 2;

const ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS_DEVELOPMENT: string[] = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.SEPOLIA,
  CHAIN_IDS.BSC,
];

const ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS_PRODUCTION: string[] = [
  CHAIN_IDS.MAINNET,
  CHAIN_IDS.BSC,
];

export const getAllowedSmartTransactionsChainIds = (): string[] => {
  return isProduction()
    ? ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS_PRODUCTION
    : ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS_DEVELOPMENT;
};

export const SKIP_STX_RPC_URL_CHECK_CHAIN_IDS: string[] = [CHAIN_IDS.SEPOLIA];

export const CANCEL_GAS_LIMIT_DEC = 21000;

export const SMART_TRANSACTIONS_LEARN_MORE_URL =
  'https://support.metamask.io/transactions-and-gas/transactions/smart-transactions/';
