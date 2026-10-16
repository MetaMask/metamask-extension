import type { Hex } from '@metamask/utils';

/**
 * MMPay RPC method name exposed to dApps.
 */
export const MMPAY_RPC_METHOD = 'wallet_mmPay';

/**
 * USDC token contract address on Arbitrum One.
 *
 * Kept in sync with the UI-side source of truth:
 * `ui/pages/confirmations/constants/perps.ts` → `ARBITRUM_USDC.address`.
 * This module cannot import from `ui/` because it runs in the background
 * script, so the value is re-declared here.
 */
export const ARBITRUM_USDC_ADDRESS =
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Hex;

/**
 * USDC token decimals (6 on every chain).
 */
export const USDC_DECIMALS = 6;

/**
 * Hyperliquid bridge contract address on Arbitrum.
 *
 * Kept in sync with `ui/pages/confirmations/constants/perps.ts`
 * → `HYPERLIQUID_BRIDGE_ADDRESS`.
 *
 * @see https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/bridge2
 * @see https://arbiscan.io/address/0x2df1c51e09aecf9cacb7bc98cb1742757f163df7
 */
export const HYPERLIQUID_BRIDGE_ADDRESS =
  '0x2Df1c51E09aECF9cacB7bc98cB1742757f163dF7' as Hex;
