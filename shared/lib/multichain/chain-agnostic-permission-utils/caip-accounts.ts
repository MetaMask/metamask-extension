import {
  Caip25CaveatValue,
  InternalScopesObject,
  parseScopeString,
} from '@metamask/chain-agnostic-permission';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { CaipAccountId, parseCaipAccountId } from '@metamask/utils';

/**
 * Gets all accounts from an array of scopes objects
 * This extracts all account IDs from both required and optional scopes
 * and returns a unique set.
 *
 * @param scopesObjects - The scopes objects to extract accounts from
 * @returns Array of unique account IDs
 */
export function getCaipAccountIdsFromScopesObjects(
  scopesObjects: InternalScopesObject[],
): CaipAccountId[] {
  const allAccounts = new Set<CaipAccountId>();

  for (const scopeObject of scopesObjects) {
    for (const { accounts } of Object.values(scopeObject)) {
      for (const account of accounts) {
        allAccounts.add(account);
      }
    }
  }

  return Array.from(allAccounts);
}

/**
 * Gets all permitted accounts from a CAIP-25 caveat
 * This extracts all account IDs from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract accounts from
 * @returns Array of unique account IDs
 */
export function getCaipAccountIdsFromCaip25CaveatValue(
  caip25CaveatValue: Caip25CaveatValue,
): CaipAccountId[] {
  return getCaipAccountIdsFromScopesObjects([
    caip25CaveatValue.requiredScopes,
    caip25CaveatValue.optionalScopes,
  ]);
}

/**
 * Checks if an internal account is connected to any of the permitted accounts
 * based on scope matching
 *
 * @param internalAccount - The internal account to check against permitted accounts
 * @param permittedAccounts - Array of CAIP-10 account IDs that are permitted
 * @returns True if the account is connected to any permitted account
 */
export function isInternalAccountInPermittedAccountIds(
  internalAccount: InternalAccount,
  permittedAccounts: CaipAccountId[],
): boolean {
  if (!internalAccount || !permittedAccounts.length) {
    return false;
  }

  const parsedInteralAccountScopes = internalAccount.scopes.map((scope) => {
    return parseScopeString(scope);
  });

  return permittedAccounts.some((account) => {
    const parsedPermittedAccount = parseCaipAccountId(account);

    return parsedInteralAccountScopes.some(({ namespace, reference }) => {
      if (
        namespace !== parsedPermittedAccount.chain.namespace ||
        internalAccount.address !== parsedPermittedAccount.address
      ) {
        return false;
      }

      return (
        reference === '0' ||
        reference === parsedPermittedAccount.chain.reference
      );
    });
  });
}
