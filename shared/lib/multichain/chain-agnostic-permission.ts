import {
  Caip25CaveatType,
  Caip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  CaipAccountId,
  CaipChainId,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { isEqualCaseInsensitive } from '../../modules/string-utils';

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
    value: Caip25CaveatValue | unknown;
  }[];
}):
  | {
      type: string;
      value: Caip25CaveatValue | unknown;
    }
  | undefined {
  if (!Array.isArray(caip25Permission.caveats)) {
    return undefined;
  }
  return caip25Permission.caveats.find(
    (caveat) => caveat.type === Caip25CaveatType,
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
  const permittedAccounts = new Set<CaipAccountId>();

  Object.values(caip25CaveatValue.requiredScopes).forEach(({ accounts }) => {
    accounts.forEach((account) => {
      permittedAccounts.add(account as CaipAccountId);
    });
  });

  Object.values(caip25CaveatValue.optionalScopes).forEach(({ accounts }) => {
    accounts.forEach((account) => {
      permittedAccounts.add(account as CaipAccountId);
    });
  });

  return Array.from(permittedAccounts);
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
    value: Caip25CaveatValue | unknown;
  }[];
}): CaipAccountId[] {
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  if (!caip25Caveat) {
    return [];
  }

  return getAllAccountsFromCaip25CaveatValue(
    caip25Caveat.value as Caip25CaveatValue,
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
    value: Caip25CaveatValue | unknown;
  }[];
}): CaipChainId[] {
  const caip25Caveat = getCaip25CaveatFromPermission(caip25Permission);
  if (!caip25Caveat) {
    return [];
  }

  return getAllScopesFromCaip25CaveatValue(
    caip25Caveat.value as Caip25CaveatValue,
  );
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
      const internalAccountScope = scope as CaipChainId;
      const { namespace, reference } = parseCaipChainId(internalAccountScope);

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
