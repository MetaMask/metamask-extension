import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from './network';

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

export const ONDO_TOKENIZED_TOKEN_NAME = 'Ondo Tokenized';
