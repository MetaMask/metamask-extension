import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../shared/constants/network';

export const MAX_SELECTED_ALLOWED_TOKENS = 5;
export const MIN_SELECTED_ALLOWED_TOKENS = 2;
export const DEFAULT_SLIPPAGE_PERCENT = 0.5;
export const SLIPPAGE_PERCENT_OPTIONS = [0.5, 2];
export const LOW_SLIPPAGE_PERCENT_THRESHOLD = 0.5;
export const DEFAULT_SEND_AMOUNT_PERCENT = 100;
export const MIN_SEND_PERCENT = 0;
export const MAX_SEND_PERCENT = 100;
export const SEND_PERCENTS_STEPS = 25;
export const TRADES_REQUEST_DEBOUNCE_MS = 300;
export const QUOTE_REQUEST_DEBOUNCE_MS = 300;

/**
 * V1 of batch sell functionality relies on a hardcoded list
 * of supported networks.
 */
export const BATCH_SELL_SUPPORTED_CHAIN_IDS = new Set([
  toEvmCaipChainId(CHAIN_IDS.MAINNET),
  toEvmCaipChainId(CHAIN_IDS.BSC),
  toEvmCaipChainId(CHAIN_IDS.BASE),
  toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
  toEvmCaipChainId(CHAIN_IDS.ARBITRUM),
  toEvmCaipChainId(CHAIN_IDS.POLYGON),
]);
