import {
  InternalScopeObject,
  InternalScopesObject,
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
 * Gets all permitted accounts from a CAIP-25 caveat
 * This extracts all account IDs from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract accounts from
 * @returns Array of unique account IDs
 */
export function getAllPermittedAccounts(
  caip25CaveatValue: Caip25CaveatValue,
): CaipAccountId[] {
  const permittedAccounts = new Set<CaipAccountId>();

  // Extract accounts from required scopes
  Object.values(caip25CaveatValue.requiredScopes).forEach(({ accounts }) => {
    accounts.forEach((account) => {
      permittedAccounts.add(account as CaipAccountId);
    });
  });

  // Extract accounts from optional scopes
  Object.values(caip25CaveatValue.optionalScopes).forEach(({ accounts }) => {
    accounts.forEach((account) => {
      permittedAccounts.add(account as CaipAccountId);
    });
  });

  return Array.from(permittedAccounts);
}

/**
 * Gets all scopes (chain IDs) from a CAIP-25 caveat
 * This extracts all scopes from both required and optional scopes
 * and returns a unique set.
 *
 * @param caip25CaveatValue - The CAIP-25 caveat value to extract scopes from
 * @returns Array of unique scope strings (chain IDs)
 */
export function getAllScopes(
  caip25CaveatValue: Caip25CaveatValue,
): CaipChainId[] {
  // Extract scopes from required and optional
  const requiredScopes = Object.keys(caip25CaveatValue.requiredScopes);
  const optionalScopes = Object.keys(caip25CaveatValue.optionalScopes);

  // Combine and return unique scopes
  return Array.from(
    new Set([...requiredScopes, ...optionalScopes]),
  ) as CaipChainId[];
}

/**
 * Updates the list of permitted accounts in a CAIP-25 caveat with the given accounts
 *
 * @param caip25CaveatValue - The original CAIP-25 caveat value
 * @param updatedAccounts - The array of accounts to set
 * @returns The updated CAIP-25 caveat value with new accounts
 */
export function updatePermittedAccounts(
  caip25CaveatValue: Caip25CaveatValue,
  updatedAccounts: CaipAccountId[],
): Caip25CaveatValue {
  // Create a new caveat value object to avoid modifying the original
  const updatedCaveatValue: Caip25CaveatValue = {
    ...caip25CaveatValue,
    requiredScopes: { ...caip25CaveatValue.requiredScopes },
    optionalScopes: { ...caip25CaveatValue.optionalScopes },
  };

  // Clear existing accounts in all scopes
  Object.entries(updatedCaveatValue.requiredScopes).forEach(
    ([scope, scopeObj]) => {
      if (scopeObj) {
        updatedCaveatValue.requiredScopes[scope as keyof InternalScopesObject] =
          {
            ...scopeObj,
            accounts: [],
          };
      }
    },
  );

  Object.entries(updatedCaveatValue.optionalScopes).forEach(
    ([scope, scopeObj]) => {
      if (scopeObj) {
        updatedCaveatValue.optionalScopes[scope as keyof InternalScopesObject] =
          {
            ...scopeObj,
            accounts: [],
          };
      }
    },
  );

  // Add the updated accounts to the appropriate scopes
  // For now, we'll add all accounts to all scopes
  // This is a simplification and might need to be refined based on business logic
  const allScopes = getAllScopes(caip25CaveatValue);

  for (const scope of allScopes) {
    const scopeKey = scope as string;

    if (
      Object.prototype.hasOwnProperty.call(
        updatedCaveatValue.requiredScopes,
        scopeKey,
      )
    ) {
      const requiredScope =
        updatedCaveatValue.requiredScopes[
          scopeKey as keyof InternalScopesObject
        ];
      if (requiredScope) {
        requiredScope.accounts = updatedAccounts;
      }
    } else if (
      Object.prototype.hasOwnProperty.call(
        updatedCaveatValue.optionalScopes,
        scopeKey,
      )
    ) {
      const optionalScope =
        updatedCaveatValue.optionalScopes[
          scopeKey as keyof InternalScopesObject
        ];
      if (optionalScope) {
        optionalScope.accounts = updatedAccounts;
      }
    }
  }

  return updatedCaveatValue;
}

/**
 * Updates the list of permitted chain IDs in a CAIP-25 caveat with the given chain IDs
 *
 * @param caip25CaveatValue - The original CAIP-25 caveat value
 * @param updatedChainIds - The array of chain IDs to set
 * @returns The updated CAIP-25 caveat value with new chain IDs
 */
export function updatePermittedChainIds(
  caip25CaveatValue: Caip25CaveatValue,
  updatedChainIds: CaipChainId[],
): Caip25CaveatValue {
  // Create a new base caveat value to avoid modifying the original
  const updatedCaveatValue: Caip25CaveatValue = {
    ...caip25CaveatValue,
    requiredScopes: {} as InternalScopesObject,
    optionalScopes: {} as InternalScopesObject,
  };

  // Create empty requiredScopes and optionalScopes objects
  const newRequiredScopes: Record<string, InternalScopeObject> = {};
  const newOptionalScopes: Record<string, InternalScopeObject> = {};

  // Transfer all existing required scopes that are in the updated chain IDs list
  // to the new caveat value
  for (const chainId of updatedChainIds) {
    const chainIdKey = chainId.toString();

    // Check if the chainId exists in requiredScopes
    if (
      Object.prototype.hasOwnProperty.call(
        caip25CaveatValue.requiredScopes,
        chainIdKey,
      )
    ) {
      const existingScope =
        caip25CaveatValue.requiredScopes[
          chainIdKey as keyof InternalScopesObject
        ];
      if (existingScope) {
        newRequiredScopes[chainIdKey] = { ...existingScope };
      }
    }
    // Check if the chainId exists in optionalScopes
    else if (
      Object.prototype.hasOwnProperty.call(
        caip25CaveatValue.optionalScopes,
        chainIdKey,
      )
    ) {
      const existingScope =
        caip25CaveatValue.optionalScopes[
          chainIdKey as keyof InternalScopesObject
        ];
      if (existingScope) {
        newOptionalScopes[chainIdKey] = { ...existingScope };
      }
    }
    // If this is a new chain ID, add it as an optional scope with empty accounts
    else {
      newOptionalScopes[chainIdKey] = {
        accounts: [],
      };
    }
  }

  // Assign the new scopes back to the updatedCaveatValue
  updatedCaveatValue.requiredScopes =
    newRequiredScopes as unknown as InternalScopesObject;
  updatedCaveatValue.optionalScopes =
    newOptionalScopes as unknown as InternalScopesObject;

  return updatedCaveatValue;
}

/**
 * Merges the given chainIds with existing chainIds in a CAIP-25 caveat
 *
 * @param caip25CaveatValue - The original CAIP-25 caveat value
 * @param chainIds - The chain IDs to add
 * @returns The updated CAIP-25 caveat value with merged chain IDs
 */
export function mergeChainIds(
  caip25CaveatValue: Caip25CaveatValue,
  chainIds: CaipChainId[],
): Caip25CaveatValue {
  const existingChainIds = getAllScopes(caip25CaveatValue);
  const mergedChainIds = Array.from(
    new Set([...existingChainIds, ...chainIds]),
  );

  return updatePermittedChainIds(caip25CaveatValue, mergedChainIds);
}

/**
 * Checks if an internal account is connected to any of the permitted accounts
 * based on scope matching
 *
 * @param permittedAccounts - Array of CAIP-10 account IDs that are permitted
 * @param internalAccount - The internal account to check against permitted accounts
 * @returns True if the account is connected to any permitted account
 */
export function isAccountConnectedToPermittedAccounts(
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
