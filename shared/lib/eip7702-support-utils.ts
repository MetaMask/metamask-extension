import { Hex } from '@metamask/utils';
import { IsAtomicBatchSupportedResultEntry } from '@metamask/transaction-controller';
import { FeatureFlags, RemoteFeatureFlagControllerState } from '@metamask/remote-feature-flag-controller';

/**
 * Checks if EIP-7702 is supported for a specific chain based on atomic batch support results.
 * This implements the core logic for determining EIP-7702 support that is used across
 * multiple parts of the codebase.
 *
 * @param atomicBatchSupport - Array of atomic batch support results
 * @param chainId - The chain ID to check support for
 * @returns The atomic batch support result for the specified chain, or undefined if not found
 */
export function findAtomicBatchSupportForChain(
  atomicBatchSupport: IsAtomicBatchSupportedResultEntry[],
  chainId: Hex,
): IsAtomicBatchSupportedResultEntry | undefined {
  return atomicBatchSupport.find(
    (result) => result.chainId.toLowerCase() === chainId.toLowerCase(),
  );
}

/**
 * Checks if a chain supports EIP-7702 and returns the support status, upgrade contract address, and delegation address.
 * This implements the core logic: a chain is supported if it exists and either:
 * - Has no delegation address (not yet upgraded), OR
 * - Has a delegation address and is marked as supported
 *
 * @param atomicBatchChainSupport - The atomic batch support result for a specific chain
 * @returns Object with isSupported boolean, upgradeContractAddress, and delegationAddress
 */
export function checkEip7702Support(
  atomicBatchChainSupport: IsAtomicBatchSupportedResultEntry | undefined,
): {
  isSupported: boolean;
  upgradeContractAddress: Hex | null;
  delegationAddress: Hex | null;
} {
  const isSupported = Boolean(
    atomicBatchChainSupport &&
      (!atomicBatchChainSupport.delegationAddress ||
        atomicBatchChainSupport.isSupported),
  );

  return {
    isSupported,
    upgradeContractAddress: isSupported
      ? (atomicBatchChainSupport?.upgradeContractAddress ?? null)
      : null,
    delegationAddress: isSupported
      ? (atomicBatchChainSupport?.delegationAddress ?? null)
      : null,
  };
}

// Feature flag definitions from @metamask/transaction-controller
const EIP7702_FEATURE_FLAG = 'confirmations_eip_7702';

type TransactionControllerPartialFeatureFlags = {
  /** Feature flags to support EIP-7702 / type-4 transactions. */
  [EIP7702_FEATURE_FLAG]?: {
    /**
     * All contracts that support EIP-7702 batch transactions.
     * Keyed by chain ID.
     * First entry in each array is the contract that standard EOAs will be upgraded to.
     */
    contracts?: Record<
      Hex,
      {
        /** Address of the smart contract. */
        address: Hex;

        /** Signature to verify the contract is authentic. */
        signature: Hex;
      }[]
    >;

    /** Chains enabled for EIP-7702 batch transactions. */
    supportedChains?: Hex[];
  };
};

export function getEip7702SupportedChains({remoteFeatureFlags}: RemoteFeatureFlagControllerState): Hex[] {
  const eip7702FeatureFlags = remoteFeatureFlags as TransactionControllerPartialFeatureFlags | undefined;

  return eip7702FeatureFlags?.[EIP7702_FEATURE_FLAG]?.supportedChains ?? [];
}
