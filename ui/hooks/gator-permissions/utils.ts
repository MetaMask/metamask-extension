import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import { Delegation } from '../../../shared/lib/delegation/delegation';

/**
 * Extracts the delegation from the gator permission encoded context.
 *
 * @param permissionContext - The gator permission context to extract the delegation from.
 * @returns The delegation.
 * @throws An error if no delegation is found.
 */
export function extractDelegationFromGatorPermissionContext(
  permissionContext: Hex,
): Delegation {
  // Gator 7715 permissions only have a single signed delegation:
  const delegations = decodeDelegations(permissionContext);
  const firstDelegation = delegations[0];
  if (!firstDelegation) {
    throw new Error('No delegation found');
  }

  if (delegations.length !== 1) {
    throw new Error('Multiple delegations found');
  }

  return {
    ...firstDelegation,
    salt: `0x${firstDelegation.salt.toString(16)}`,
  };
}
