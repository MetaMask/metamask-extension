import {
  Caip25CaveatType,
  Caip25CaveatValue,
  InternalScopesObject,
  InternalScopeString,
  KnownSessionProperties,
  NormalizedScopesObject,
  parseScopeString,
} from '@metamask/chain-agnostic-permission';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  CaipAccountId,
  CaipChainId,
  CaipNamespace,
  parseCaipAccountId,
} from '@metamask/utils';
import { isEqualCaseInsensitive } from '../../modules/string-utils';

// Helpers to be adapted and moved to @metamask/chain-agnostic-permission

/**
 * Helper to get the CAIP-25 caveat from a permission
 *
 * @param caip25Permission - The CAIP-25 permission object
 * @param caip25Permission.caveats - The caveats of the CAIP-25 permission
 * @returns The CAIP-25 caveat or undefined if not found
 */
export function getCaip25CaveatFromPermission(caip25Permission: {
  caveats: {
    type: string;
    value: Caip25CaveatValue;
  }[];
}):
  | {
      type: string;
      value: Caip25CaveatValue;
    }
  | undefined {
  return caip25Permission.caveats.find(
    (caveat) => caveat.type === Caip25CaveatType,
  );
}

/**
 * Gets all accounts from a scopes object
 * This extracts all account IDs from both required and optional scopes
 * and returns a unique set.
 *
 * @param scopesObject - The scopes object to extract accounts from
 * @returns Array of unique account IDs
 */
export function getAllAccountsFromScopesObject(
  scopesObject: InternalScopesObject,
): CaipAccountId[] {
  const allAccounts = new Set<CaipAccountId>();

  Object.values(scopesObject).forEach(({ accounts }) => {
    accounts.forEach((account) => {
      allAccounts.add(account);
    });
  });

  return Array.from(allAccounts);
}

export function getAllAccountsFromScopesObjects(
  scopesObjects: InternalScopesObject[],
): CaipAccountId[] {
  return Array.from(
    new Set([...scopesObjects.flatMap(getAllAccountsFromScopesObject)]),
  );
}

/**
 * Gets all permitted accounts from a CAIP-25 caveat
 * This extracts all account IDs from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract accounts from
 * @returns Array of unique account IDs
 */
export function getAllAccountsFromCaip25CaveatValue(
  caip25CaveatValue: Caip25CaveatValue,
): CaipAccountId[] {
  return Array.from(
    new Set([
      ...getAllAccountsFromScopesObject(caip25CaveatValue.requiredScopes),
      ...getAllAccountsFromScopesObject(caip25CaveatValue.optionalScopes),
    ]),
  );
}

/**
 * Gets all permitted accounts from a CAIP-25 permission
 * This extracts all account IDs from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25Permission - The CAIP-25 permission object
 * @param caip25Permission.caveats - The caveats of the CAIP-25 permission
 * @returns Array of unique account IDs
 */
export function getAllAccountsFromPermission(caip25Permission: {
  caveats: {
    type: string;
    value: Caip25CaveatValue;
  }[];
}): CaipAccountId[] {
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  if (!caip25Caveat) {
    return [];
  }

  return getAllAccountsFromCaip25CaveatValue(caip25Caveat.value);
}

export function getAllScopesFromScopesObject(
  scopesObject: InternalScopesObject,
): InternalScopeString[] {
  return Object.keys(scopesObject) as InternalScopeString[];
}

export function getAllScopesFromScopesObjects(
  scopesObjects: InternalScopesObject[],
): InternalScopeString[] {
  return Array.from(
    new Set([...scopesObjects.flatMap(getAllScopesFromScopesObject)]),
  );
}

/**
 * Gets all scopes (chain IDs) from a CAIP-25 caveat
 * This extracts all scopes from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract scopes from
 * @returns Array of unique scope strings (chain IDs)
 */
export function getAllScopesFromCaip25CaveatValue(
  caip25CaveatValue: Caip25CaveatValue,
): CaipChainId[] {
  const requiredScopes = Object.keys(caip25CaveatValue.requiredScopes);
  const optionalScopes = Object.keys(caip25CaveatValue.optionalScopes);

  return Array.from(
    new Set([...requiredScopes, ...optionalScopes]),
  ) as CaipChainId[];
}

/**
 * Gets all scopes (chain IDs) from a CAIP-25 permission
 * This extracts all scopes from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25Permission - The CAIP-25 permission object
 * @param caip25Permission.caveats - The caveats of the CAIP-25 permission
 * @returns Array of unique scope strings (chain IDs)
 */
export function getAllScopesFromPermission(caip25Permission: {
  caveats: {
    type: string;
    value: Caip25CaveatValue;
  }[];
}): CaipChainId[] {
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  if (!caip25Caveat) {
    return [];
  }

  return getAllScopesFromCaip25CaveatValue(caip25Caveat.value);
}

/**
 * Checks if an internal account is connected to any of the permitted accounts
 * based on scope matching
 *
 * @param permittedAccounts - Array of CAIP-10 account IDs that are permitted
 * @param internalAccount - The internal account to check against permitted accounts
 * @returns True if the account is connected to any permitted account
 */
export function isInternalAccountInPermittedAccounts(
  permittedAccounts: CaipAccountId[],
  internalAccount: InternalAccount,
): boolean {
  if (!permittedAccounts.length || !internalAccount) {
    return false;
  }

  return permittedAccounts.some((account) => {
    const parsedPermittedAccount = parseCaipAccountId(account);

    return internalAccount.scopes.some((scope) => {
      const { namespace, reference } = parseScopeString(scope);

      if (
        namespace !== parsedPermittedAccount.chain.namespace ||
        !isEqualCaseInsensitive(
          internalAccount.address,
          parsedPermittedAccount.address,
        )
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

export function isKnownSessionPropertyValue(
  value: string,
): value is KnownSessionProperties {
  return Object.values(KnownSessionProperties).includes(
    value as KnownSessionProperties,
  );
}

export function isNamespaceInScopesObject(
  scopesObject: NormalizedScopesObject,
  caipNamespace: CaipNamespace,
) {
  return Object.keys(scopesObject).some((scope) => {
    const { namespace } = parseScopeString(scope);
    return namespace === caipNamespace;
  });
}
