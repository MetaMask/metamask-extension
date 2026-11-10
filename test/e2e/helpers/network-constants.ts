import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import {
  MAINNET_DISPLAY_NAME,
  SEPOLIA_DISPLAY_NAME,
} from '../../../shared/constants/network';
import {
  MULTICHAIN_NETWORK_TO_NICKNAME,
  MultichainNetworks,
} from '../../../shared/constants/multichain/networks';

/**
 * CAIP-2 chain ids of the networks the E2E network modal tests refer to.
 * Derived from the shared hex `CHAIN_IDS` so the values cannot drift.
 */
export const NetworkId = {
  ARBITRUM: toEvmCaipChainId(CHAIN_IDS.ARBITRUM),
  AVALANCHE: toEvmCaipChainId(CHAIN_IDS.AVALANCHE),
  BASE: toEvmCaipChainId(CHAIN_IDS.BASE),
  BSC: toEvmCaipChainId(CHAIN_IDS.BSC),
  ETHEREUM: toEvmCaipChainId(CHAIN_IDS.MAINNET),
  LINEA: toEvmCaipChainId(CHAIN_IDS.LINEA_MAINNET),
  OPTIMISM: toEvmCaipChainId(CHAIN_IDS.OPTIMISM),
  POLYGON: toEvmCaipChainId(CHAIN_IDS.POLYGON),
  XDC: toEvmCaipChainId(CHAIN_IDS.XDC),
} as const;

export type NetworkId = (typeof NetworkId)[keyof typeof NetworkId];

/**
 * Display names of built-in networks as rendered in the network UI, taken from
 * the shared constants so the E2E tests match the product.
 */
export const NetworkName = {
  BITCOIN: MULTICHAIN_NETWORK_TO_NICKNAME[MultichainNetworks.BITCOIN],
  ETHEREUM: MAINNET_DISPLAY_NAME,
  SEPOLIA: SEPOLIA_DISPLAY_NAME,
  TRON: MULTICHAIN_NETWORK_TO_NICKNAME[MultichainNetworks.TRON],
} as const;
