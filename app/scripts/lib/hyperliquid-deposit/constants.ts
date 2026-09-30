import type { CaipAssetType, Hex } from '@metamask/utils';

// CAIP asset ID for Arbitrum USDC (eip155:42161/erc20:address).
export const HYPERLIQUID_DEPOSIT_USDC_CAIP_ID =
  'eip155:42161/erc20:0xaf88d065e77c8cC2239327C5EDb3A432268e5831' as CaipAssetType;

// Minimum Arbitrum $10 USDC balance (in raw units).
// USDC has 6 decimals, so $10 = 10 × 10^6 = 10,000,000.
export const HYPERLIQUID_DEPOSIT_USDC_THRESHOLD = 10_000_000n;

export const HYPERLIQUID_DEPOSIT_USDC_DECIMALS = 6;

// EIP-712 typed data identifiers for Hyperliquid's "Enable trading" signature.
export const HYPERLIQUID_APPROVE_AGENT_PRIMARY_TYPE =
  'HyperliquidTransaction:ApproveAgent';
export const HYPERLIQUID_SIGN_TRANSACTION_DOMAIN_NAME =
  'HyperliquidSignTransaction';

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
