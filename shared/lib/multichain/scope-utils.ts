import {
  KnownCaipNamespace,
  parseCaipChainId,
  CaipChainId,
  CaipNamespace,
  CaipAccountId,
} from '@metamask/utils';
import { EthScope } from '@metamask/keyring-api';
// eslint-disable-next-line import/no-restricted-paths
import { AccountGroupWithInternalAccounts } from '../../../ui/selectors/multichain-accounts/account-tree.types';

/**
 * Helper function to check if any of the account scopes match the target scope.
 * Handles the special case of eip155:0 (wildcard) which matches any EVM scope.
 *
 * This function provides a consistent approach to scope matching across the codebase,
 * ensuring that eip155:0 wildcard logic is handled uniformly in both selectors and
 * permission/handler level code.
 *
 * @param accountScopes - Array of scope strings from the account
 * @param targetScope - The target scope to match against
 * @returns True if any scope matches, false otherwise
 */
export const anyScopesMatch = (
  accountScopes: string[],
  targetScope: string,
): boolean => {
  if (!Array.isArray(accountScopes) || accountScopes.length === 0) {
    return false;
  }

  // Direct match
  if (accountScopes.includes(targetScope)) {
    return true;
  }

  try {
    const parsed = parseCaipChainId(targetScope as `${string}:${string}`);
    const { namespace, reference } = parsed;

    if (namespace === KnownCaipNamespace.Eip155) {
      // If requesting eip155:0 (wildcard), include any account that has any EVM scope
      if (reference === '0') {
        return accountScopes.some((scope) =>
          scope.startsWith(`${KnownCaipNamespace.Eip155}:`),
        );
      }

      // For a specific EVM chain, include accounts that have the wildcard scope
      return accountScopes.includes(EthScope.Eoa);
    }
  } catch {
    // If parsing fails, fall back to exact match only
  }

  return false;
};

/**
 * Helper function to check if a single account scope matches the target scope.
 * This is a convenience wrapper around anyScopesMatch for single scope comparisons.
 *
 * @param accountScope - Single scope string from the account
 * @param targetScope - The target scope to match against
 * @returns True if the scope matches, false otherwise
 */
export const scopeMatches = (
  accountScope: string,
  targetScope: string,
): boolean => {
  return anyScopesMatch([accountScope], targetScope);
};

/**
 * Checks if an account supports the requested chain IDs
 *
 * @param accountScopes - Array of account scopes to check
 * @param requestedChainIds - Array of requested chain IDs to match against
 * @returns True if any scope matches any requested chain ID
 */
export const hasChainIdSupport = (
  accountScopes: string[] | undefined,
  requestedChainIds: CaipChainId[],
): boolean => {
  if (!accountScopes || requestedChainIds.length === 0) {
    return false;
  }

  return accountScopes.some((accountScope) =>
    requestedChainIds.some((requestedChainId) =>
      anyScopesMatch([accountScope], requestedChainId),
    ),
  );
};

/**
 * Checks if an account supports the requested namespaces
 *
 * @param accountScopes - Array of account scopes to check
 * @param requestedNamespaces - Set of requested namespaces to match against
 * @returns True if any scope namespace matches any requested namespace
 */
export const hasNamespaceSupport = (
  accountScopes: string[] | undefined,
  requestedNamespaces: Set<CaipNamespace>,
): boolean => {
  if (!accountScopes || requestedNamespaces.size === 0) {
    return false;
  }

  for (const scope of accountScopes) {
    const [scopeNamespace] = scope.split(':');
    if (
      scopeNamespace &&
      requestedNamespaces.has(scopeNamespace as CaipNamespace)
    ) {
      return true;
    }
  }
  return false;
};

export const getCaip25AccountFromAccountGroupAndScope = (
  accountGroups: AccountGroupWithInternalAccounts[],
  scopes: CaipChainId[],
) => {
  // Pre-parse all chain namespaces and cache common strings
  const chainNamespaces = new Map<CaipChainId, string>();
  const eip155Scope = `${KnownCaipNamespace.Eip155}:0`;
  scopes.forEach((chainId) => {
    try {
      const { namespace } = parseCaipChainId(chainId);
      chainNamespaces.set(chainId, namespace);
    } catch (err) {
      // Skip invalid chain IDs
    }
  });

  const updatedSelectedCaipAccountAddresses = new Set<CaipAccountId>();

  accountGroups.forEach((accountGroup) => {
    accountGroup.accounts.forEach((account) => {
      const accountScopesSet = new Set(account.scopes);

      scopes.forEach((chainId) => {
        const namespace = chainNamespaces.get(chainId);
        if (!namespace) {
          return;
        }

        let shouldAdd = false;

        if (namespace === KnownCaipNamespace.Eip155) {
          // Use the same logic as anyScopesMatch for EIP-155 scopes
          // Check for direct match first
          shouldAdd = accountScopesSet.has(chainId);

          // If no direct match, check for wildcard scope
          if (!shouldAdd) {
            shouldAdd = accountScopesSet.has(eip155Scope);
          }
        } else {
          shouldAdd = accountScopesSet.has(chainId);
        }

        if (shouldAdd) {
          updatedSelectedCaipAccountAddresses.add(
            `${chainId}:${account.address}`,
          );
        }
      });
    });
  });

  return Array.from(updatedSelectedCaipAccountAddresses);
};
