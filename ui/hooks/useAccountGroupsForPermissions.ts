import { useSelector } from 'react-redux';
import {
  Caip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { CaipChainId, CaipNamespace } from '@metamask/utils';
import { useMemo } from 'react';
import {
  getCaip25AccountIdToMultichainAccountGroupMap,
  getAccountGroupWithInternalAccounts,
  getScopeToAccountGroupMap,
} from '../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree.types';

/**
 * Hook that manages account groups for CAIP-25 permissions, providing both connected
 * and supported account groups based on existing permissions and requested chains/namespaces.
 *
 * This hook handles the complex logic of:
 * - Filtering account groups that support requested chains/namespaces
 * - Mapping existing CAIP-25 permissions to account groups
 * - Converting between different account ID formats
 *
 * @param existingPermission - The current CAIP-25 caveat value containing existing permissions
 * @param requestedCaipChainIds - Array of CAIP chain IDs being requested for permission
 * @param requestedNamespacesWithoutWallet - Array of CAIP namespaces being requested (excluding wallet namespace)
 * @returns Object containing connected account groups, supported account groups, and existing connected CAIP account IDs
 */
export const useAccountGroupsForPermissions = (
  existingPermission: Caip25CaveatValue,
  requestedCaipChainIds: CaipChainId[],
  requestedNamespacesWithoutWallet: CaipNamespace[],
) => {
  /** All account groups with their internal account details */
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  /** Map from CAIP-25 account IDs to multichain account group IDs */
  const caip25ToAccountGroupMap = useSelector(
    getCaip25AccountIdToMultichainAccountGroupMap,
  );
  const scopeToAccountGroupMap = useSelector(getScopeToAccountGroupMap);

  const supportedAccountGroups = useMemo(() => {
    if (requestedCaipChainIds.length) {
      const chainIdSet = new Set(requestedCaipChainIds);
      const supportedGroups = new Set<AccountGroupWithInternalAccounts>();

      // For each requested chain ID, find all account groups that support it
      Array.from(scopeToAccountGroupMap.entries()).forEach(
        ([scope, scopeAccountGroups]) => {
          if (chainIdSet.has(scope as CaipChainId)) {
            // Handle both array and single group formats for backward compatibility
            const groups = Array.isArray(scopeAccountGroups)
              ? scopeAccountGroups
              : [scopeAccountGroups];
            groups.forEach((group) => supportedGroups.add(group));
          }
        },
      );

      return Array.from(supportedGroups);
    }

    // Early return if no namespaces requested
    if (requestedNamespacesWithoutWallet.length === 0) {
      return [];
    }

    const namespaceSet = new Set(requestedNamespacesWithoutWallet);

    return accountGroups.filter((accountGroup) => {
      for (const account of accountGroup.accounts) {
        // Ensure account.scopes exists and is iterable
        if (account.scopes && Array.isArray(account.scopes)) {
          for (const scope of account.scopes) {
            const scopeNamespace = scope.split(':')[0];
            if (namespaceSet.has(scopeNamespace as CaipNamespace)) {
              return true;
            }
          }
        }
      }
      return false; // No matching scopes found
    });
  }, [
    requestedCaipChainIds,
    scopeToAccountGroupMap,
    accountGroups,
    requestedNamespacesWithoutWallet,
  ]);

  /**
   * Connected account groups and their CAIP account IDs from existing permissions.
   * Processes existing CAIP-25 permissions to find corresponding account groups.
   */
  const { connectedAccountGroups, connectedCaipAccountIds } = useMemo(() => {
    /** Extract all connected CAIP account IDs from existing permission */
    const connectedAccountIds =
      getCaipAccountIdsFromCaip25CaveatValue(existingPermission);

    const uniqueAccountGroupIds = new Set<string>();
    const connectedAccountGroupsArray: AccountGroupWithInternalAccounts[] = [];

    connectedAccountIds.forEach((caipAccountId) => {
      const accountGroupId = caip25ToAccountGroupMap.get(caipAccountId);
      if (accountGroupId && !uniqueAccountGroupIds.has(accountGroupId)) {
        const accountGroup = accountGroups.find(
          (group) => group.id === accountGroupId,
        );
        if (accountGroup) {
          uniqueAccountGroupIds.add(accountGroupId);
          connectedAccountGroupsArray.push(accountGroup);
        }
      }
    });

    return {
      connectedAccountGroups: connectedAccountGroupsArray,
      connectedCaipAccountIds: connectedAccountIds,
    };
  }, [existingPermission, caip25ToAccountGroupMap, accountGroups]);

  return {
    /** Account groups that are currently connected via existing permissions */
    connectedAccountGroups,
    /** Account groups that support the requested chains/namespaces */
    supportedAccountGroups,
    /** CAIP account IDs that are already connected via existing permissions */
    existingConnectedCaipAccountIds: connectedCaipAccountIds,
  };
};
