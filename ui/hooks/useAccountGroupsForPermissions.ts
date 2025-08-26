import { useSelector } from 'react-redux';
import {
  Caip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { CaipChainId, CaipNamespace } from '@metamask/utils';
import { useMemo } from 'react';
import { getAccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree.types';
import {
  extractAddressesFromCaipAccountIds,
  hasChainIdSupport,
  hasNamespaceSupport,
} from '../../shared/lib/multichain/scope-utils';

/**
 * Checks if an account group has any connected accounts
 *
 * @param accountGroup - Account group to check for connected accounts
 * @param connectedAddresses - Set of connected account addresses
 * @returns True if any account in the group is connected
 */
const hasConnectedAccounts = (
  accountGroup: AccountGroupWithInternalAccounts,
  connectedAddresses: Set<string>,
): boolean => {
  return accountGroup.accounts.some((account) =>
    connectedAddresses.has(account.address.toLowerCase()),
  );
};

/**
 * Checks if an account group supports the requested chains or namespaces
 *
 * @param accountGroup - Account group to check for scope support
 * @param requestedChainIds - Array of requested chain IDs to match against
 * @param requestedNamespaces - Set of requested namespaces to match against
 * @returns True if any account in the group supports the requested scopes
 */
const hasSupportedScopes = (
  accountGroup: AccountGroupWithInternalAccounts,
  requestedChainIds: CaipChainId[],
  requestedNamespaces: Set<CaipNamespace>,
): boolean => {
  return accountGroup.accounts.some((account) => {
    if (requestedChainIds.length > 0) {
      return hasChainIdSupport(account.scopes, requestedChainIds);
    }
    return hasNamespaceSupport(account.scopes, requestedNamespaces);
  });
};

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
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const {
    supportedAccountGroups,
    connectedAccountGroups,
    connectedCaipAccountIds,
  } = useMemo(() => {
    const connectedAccountIds =
      getCaipAccountIdsFromCaip25CaveatValue(existingPermission);
    const connectedAddresses =
      extractAddressesFromCaipAccountIds(connectedAccountIds);
    const requestedNamespaceSet = new Set(requestedNamespacesWithoutWallet);

    const connectedAccountGroupsArray: AccountGroupWithInternalAccounts[] = [];
    const uniqueAccountGroupIds = new Set<string>();
    const supportedGroups = new Set<AccountGroupWithInternalAccounts>();

    for (const accountGroup of accountGroups) {
      const isConnected = hasConnectedAccounts(
        accountGroup,
        connectedAddresses,
      );
      const isSupported = hasSupportedScopes(
        accountGroup,
        requestedCaipChainIds,
        requestedNamespaceSet,
      );

      if (isConnected && !uniqueAccountGroupIds.has(accountGroup.id)) {
        uniqueAccountGroupIds.add(accountGroup.id);
        connectedAccountGroupsArray.push(accountGroup);
      }

      if (isSupported) {
        supportedGroups.add(accountGroup);
      }
    }

    return {
      supportedAccountGroups: Array.from(supportedGroups),
      connectedAccountGroups: connectedAccountGroupsArray,
      connectedCaipAccountIds: connectedAccountIds,
    };
  }, [
    existingPermission,
    accountGroups,
    requestedCaipChainIds,
    requestedNamespacesWithoutWallet,
  ]);

  return {
    /** Account groups that are currently connected via existing permissions */
    connectedAccountGroups,
    /** Account groups that support the requested chains/namespaces */
    supportedAccountGroups,
    /** CAIP account IDs that are already connected via existing permissions */
    existingConnectedCaipAccountIds: connectedCaipAccountIds,
  };
};
