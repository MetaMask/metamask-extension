import { Hex } from '@metamask/utils';
import { decodeDelegations } from '@metamask/delegation-core';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { Delegation } from '../../../shared/lib/delegation/delegation';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';

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

/**
 * Finds an internal account by its address.
 *
 * @param internalAccounts - The list of internal accounts to search through.
 * @param address - The address to find.
 * @returns The internal account if found, otherwise undefined.
 */
export function findInternalAccountByAddress(
  internalAccounts: InternalAccount[],
  address: Hex,
): InternalAccount | undefined {
  return internalAccounts.find((account) =>
    isEqualCaseInsensitive(account.address, address),
  );
}
