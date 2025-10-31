import { Hex } from '@metamask/utils';
import { IsAtomicBatchSupportedResultEntry } from '@metamask/transaction-controller';

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
