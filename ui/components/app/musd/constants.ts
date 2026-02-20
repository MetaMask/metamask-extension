import type { Hex } from '@metamask/utils';
import { CHAIN_IDS } from '../../../../shared/constants/network';

export const MERKL_API_BASE_URL = 'https://api.merkl.xyz/v4';

export const MERKL_DISTRIBUTOR_ADDRESS =
  '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const;

/**
 * The chain where Merkl rewards are claimed (Linea mainnet = 0xe708 = 59144).
 * Even if a user holds mUSD on mainnet, rewards are always claimed on Linea.
 */
export const MERKL_CLAIM_CHAIN_ID = CHAIN_IDS.LINEA_MAINNET as Hex;

// Test token addresses used for Merkl test campaigns
export const AGLAMERKL_ADDRESS_MAINNET =
  '0x8d652c6d4A8F3Db96Cd866C1a9220B1447F29898';
export const AGLAMERKL_ADDRESS_LINEA =
  '0x03C2d2014795EE8cA78B62738433B457AB19F4b3';

// mUSD token address (same on all chains)
export const MUSD_TOKEN_ADDRESS = '0xacA92E438df0B2401fF60dA7E4337B687a2435DA';

// ABI for the claim method on the Merkl Distributor contract
export const DISTRIBUTOR_CLAIM_ABI = [
  'function claim(address[] calldata users, address[] calldata tokens, uint256[] calldata amounts, bytes32[][] calldata proofs)',
];

// ABI for the claimed mapping on the Merkl Distributor contract
export const DISTRIBUTOR_CLAIMED_ABI = [
  'function claimed(address user, address token) external view returns (uint208 amount, uint48 timestamp, bytes32 merkleRoot)',
];

/**
 * Map of chains and their eligible token addresses for Merkl rewards.
 * mUSD on mainnet is eligible because users earn rewards for holding it,
 * even though the actual reward claiming happens on Linea.
 */
export const ELIGIBLE_TOKENS: Record<string, string[]> = {
  [CHAIN_IDS.MAINNET]: [AGLAMERKL_ADDRESS_MAINNET, MUSD_TOKEN_ADDRESS],
  [CHAIN_IDS.LINEA_MAINNET]: [AGLAMERKL_ADDRESS_LINEA, MUSD_TOKEN_ADDRESS],
  '0xe709': [AGLAMERKL_ADDRESS_LINEA, MUSD_TOKEN_ADDRESS],
};

/** Remote feature flag key for Merkl campaign claiming */
export const MERKL_FEATURE_FLAG_KEY = 'earnMerklCampaignClaiming';
