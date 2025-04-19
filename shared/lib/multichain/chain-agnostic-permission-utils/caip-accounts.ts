import {
  Caip25CaveatValue,
  InternalScopesObject,
  parseScopeString,
} from '@metamask/chain-agnostic-permission';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  CaipAccountAddress,
  CaipAccountId,
  CaipNamespace,
  CaipReference,
  parseCaipAccountId,
} from '@metamask/utils';

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
 * Checks if an address and list of parsed scopes are connected to any of
 * the permitted accounts based on scope matching
 *
 * @param address - The CAIP account address to check against permitted accounts
 * @param parsedAccountScopes - The list of parsed CAIP chain ID to check against permitted accounts
 * @param permittedAccounts - Array of CAIP account IDs that are permitted
 * @returns True if the address and any account scope is connected to any permitted account
 */
function isAddressWithParsedScopesInPermittedAccountIds(
  address: CaipAccountAddress,
  parsedAccountScopes: {
    namespace?: CaipNamespace;
    reference?: CaipReference;
  }[],
  permittedAccounts: CaipAccountId[],
) {
  if (!address || !parsedAccountScopes.length || !permittedAccounts.length) {
    return false;
  }

  return permittedAccounts.some((account) => {
    const parsedPermittedAccount = parseCaipAccountId(account);

    return parsedAccountScopes.some(({ namespace, reference }) => {
      if (
        namespace !== parsedPermittedAccount.chain.namespace ||
        address !== parsedPermittedAccount.address
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

/**
 * Checks if an internal account is connected to any of the permitted accounts
 * based on scope matching
 *
 * @param internalAccount - The internal account to check against permitted accounts
 * @param permittedAccounts - Array of CAIP account IDs that are permitted
 * @returns True if the account is connected to any permitted account
 */
export function isInternalAccountInPermittedAccountIds(
  internalAccount: InternalAccount,
  permittedAccounts: CaipAccountId[],
): boolean {
  const parsedInteralAccountScopes = internalAccount.scopes.map((scope) => {
    return parseScopeString(scope);
  });

  return isAddressWithParsedScopesInPermittedAccountIds(
    internalAccount.address,
    parsedInteralAccountScopes,
    permittedAccounts,
  );
}

/**
 * Checks if an CAIP account ID is connected to any of the permitted accounts
 * based on scope matching
 *
 * @param accountId - The CAIP account ID to check against permitted accounts
 * @param permittedAccounts - Array of CAIP account IDs that are permitted
 * @returns True if the account is connected to any permitted account
 */
export function isAccountIdInPermittedAccountIds(
  accountId: CaipAccountId,
  permittedAccounts: CaipAccountId[],
): boolean {
  const { address, chain } = parseCaipAccountId(accountId);

  return isAddressWithParsedScopesInPermittedAccountIds(
    address,
    [chain],
    permittedAccounts,
  );
}
