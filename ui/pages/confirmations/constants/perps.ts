import type { Hex } from '@metamask/utils';

export const PERPS_CURRENCY = 'usd';
export const PERPS_MINIMUM_DEPOSIT = 0.01;

export const ARBITRUM_USDC = {
  address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Hex,
  decimals: 6,
  name: 'USD Coin',
  symbol: 'USDC',
};

/**
 * Hyperliquid bridge contract address on Arbitrum.
 * This is the contract that receives USDC deposits for Hyperliquid perps trading.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2
 * @see https://arbiscan.io/address/0x2df1c51e09aecf9cacb7bc98cb1742757f163df7
 */
export const HYPERLIQUID_BRIDGE_ADDRESS =
  '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7' as Hex;
