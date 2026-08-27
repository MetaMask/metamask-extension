import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';

// Hyperliquid deposits are funded with USDC on Arbitrum.
export const HYPERLIQUID_DEPOSIT_CHAIN_ID = CHAIN_IDS.ARBITRUM;

// Native USDC on Arbitrum One.
export const HYPERLIQUID_DEPOSIT_USDC_ADDRESS =
  '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as Hex;

// Minimum Arbitrum $10 USDC balance (in raw units).
// USDC has 6 decimals, so $10 = 10 × 10^6 = 10,000,000.
export const HYPERLIQUID_DEPOSIT_USDC_THRESHOLD = 10_000_000n;

// EIP-712 typed data identifiers for Hyperliquid's "Enable trading" signature.
export const HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE =
  'HyperliquidTransaction:ApproveAgent';
export const HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME =
  'HyperliquidSignTransaction';

// Zero address indicates API key revocation, not "Enable trading".
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
