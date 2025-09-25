import { useSelector } from 'react-redux';
import {
  Caip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
} from '@metamask/chain-agnostic-permission';
import { CaipAccountId, CaipChainId, CaipNamespace } from '@metamask/utils';
import { useMemo } from 'react';
import {
  getAccountGroupWithInternalAccounts,
  getSelectedAccountGroup,
} from '../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree.types';
import {
  getCaip25AccountFromAccountGroupAndScope,
  hasChainIdSupport,
  hasNamespaceSupport,
} from '../../shared/lib/multichain/scope-utils';

/**
 * Checks if an account group has any connected accounts
 *
 * @param accountGroup - Account group to check for connected accounts
 * @param connectedAddresses - Array of connected account addresses
 * @returns True if any account in the group is connected
 */
const hasConnectedAccounts = (
  accountGroup: AccountGroupWithInternalAccounts,
  connectedAddresses: CaipAccountId[],
): boolean => {
  return accountGroup.accounts.some((account) => {
    try {
      return isInternalAccountInPermittedAccountIds(
        account,
        connectedAddresses,
      );
    } catch {
      return false;
    }
  });
};

/**
 * Checks if an account group supports the requested chain IDs
 *
 * @param accountGroup - Account group to check for chain ID support
 * @param requestedChainIds - Array of requested chain IDs to match against
 * @returns True if any account in the group supports the requested chain IDs
 */
export const supportsChainIds = (
  accountGroup: AccountGroupWithInternalAccounts,
  requestedChainIds: CaipChainId[],
): boolean => {
  return accountGroup.accounts.some((account) =>
    hasChainIdSupport(account.scopes, requestedChainIds),
  );
};

/**
 * Checks if an account group supports the requested namespaces
 *
 * @param accountGroup - Account group to check for namespace support
 * @param requestedNamespaces - Set of requested namespaces to match against
 * @returns True if any account in the group supports the requested namespaces
 */
export const supportsNamespaces = (
  accountGroup: AccountGroupWithInternalAccounts,
  requestedNamespaces: Set<CaipNamespace>,
): boolean => {
  return accountGroup.accounts.some((account) =>
    hasNamespaceSupport(account.scopes, requestedNamespaces),
  );
};

/**
 * Checks if an account group contains any of the requested account IDs
 *
 * @param accountGroup - Account group to check for requested account IDs
 * @param requestedAccountIds - Array of requested account IDs to match against
 * @returns True if any account in the group matches the requested account IDs
 */
export const hasRequestedAccountIds = (
  accountGroup: AccountGroupWithInternalAccounts,
  requestedAccountIds: CaipAccountId[],
): boolean => {
  return accountGroup.accounts.some((account) => {
    try {
      return isInternalAccountInPermittedAccountIds(
        account,
        requestedAccountIds,
      );
    } catch {
      return false;
    }
  });
};

/**
 * Removes duplicate account groups from an array based on their IDs
 *
 * @param accountGroups - Array of account groups that may contain duplicates
 * @returns Array with unique account groups based on their IDs
 */
const deduplicateAccountGroups = (
  accountGroups: AccountGroupWithInternalAccounts[],
): AccountGroupWithInternalAccounts[] => {
  const seen = new Set<string>();
  return accountGroups.filter((group) => {
    if (seen.has(group.id)) {
      return false;
    }
    seen.add(group.id);
    return true;
  });
};

/**
 * Hook that manages account groups for CAIP-25 permissions, providing both connected
 * and supported account groups based on existing permissions, requested chains/namespaces,
 * and specific account IDs with prioritization support.
 *
 * This hook handles the complex logic of:
 * - Filtering account groups that support requested chains/namespaces
 * - Prioritizing account groups that fulfill specific requested account IDs
 * - Mapping existing CAIP-25 permissions to account groups
 * - Converting between different account ID formats
 * - Preventing duplicate account groups in results
 *
 * @param existingPermission - The current CAIP-25 caveat value containing existing permissions
 * @param requestedCaipAccountIds - Array of specific CAIP account IDs being requested (prioritized in results)
 * @param requestedCaipChainIds - Array of CAIP chain IDs being requested for permission
 * @param requestedNamespacesWithoutWallet - Array of CAIP namespaces being requested (excluding wallet namespace)
 * @returns Object containing connected account groups, supported account groups, and existing connected CAIP account IDs.
 * Account groups that fulfill requestedCaipAccountIds appear first in both arrays.
 */
export const useAccountGroupsForPermissions = (
  existingPermission: Caip25CaveatValue,
  requestedCaipAccountIds: CaipAccountId[],
  requestedCaipChainIds: CaipChainId[],
  requestedNamespacesWithoutWallet: CaipNamespace[],
) => {
  const selectedAccountGroupId = useSelector(getSelectedAccountGroup);
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const result = useMemo(() => {
    const selectedAccountGroup = accountGroups.find(
      (accountGroup) => accountGroup.id === selectedAccountGroupId,
    );

    const connectedAccountIds =
      getCaipAccountIdsFromCaip25CaveatValue(existingPermission);
    const requestedNamespaceSet = new Set(requestedNamespacesWithoutWallet);

    const connectedAccountGroups: AccountGroupWithInternalAccounts[] = [];
    const supportedAccountGroups: AccountGroupWithInternalAccounts[] = [];
    // Priority groups are groups that fulfill the requested account IDs and should be shown first
    const priorityConnectedGroups: AccountGroupWithInternalAccounts[] = [];
    const prioritySupportedGroups: AccountGroupWithInternalAccounts[] = [];
    const connectedAccountGroupWithRequested: AccountGroupWithInternalAccounts[] =
      [];

    let accountGroupsToProcess = accountGroups;

    if (selectedAccountGroup) {
      accountGroupsToProcess = Array.from(
        new Set([selectedAccountGroup, ...accountGroups]),
      );
    }

    accountGroupsToProcess.forEach((accountGroup) => {
      const isConnected = hasConnectedAccounts(
        accountGroup,
        connectedAccountIds,
      );
      const isSupported =
        requestedCaipChainIds.length > 0
          ? supportsChainIds(accountGroup, requestedCaipChainIds)
          : supportsNamespaces(accountGroup, requestedNamespaceSet);
      const fulfillsRequestedAccounts = hasRequestedAccountIds(
        accountGroup,
        requestedCaipAccountIds,
      );

      if (isConnected) {
        if (fulfillsRequestedAccounts) {
          priorityConnectedGroups.push(accountGroup);
        } else {
          connectedAccountGroups.push(accountGroup);
        }
      }

      // Add to connectedAccountGroupWithRequested if either connected or fulfills requested accounts
      if (isConnected || fulfillsRequestedAccounts) {
        connectedAccountGroupWithRequested.push(accountGroup);
      }

      if (isSupported || fulfillsRequestedAccounts) {
        if (fulfillsRequestedAccounts) {
          prioritySupportedGroups.push(accountGroup);
        } else if (isSupported) {
          supportedAccountGroups.push(accountGroup);
        }
      }
    });

    // This are caip account ids of connected account groups with the requested chains/namespaces
    // It would also include newly requested chain requests.
    const caipAccountIdsOfConnectedAccountGroupWithRequested = Array.from(
      new Set([
        ...getCaip25AccountFromAccountGroupAndScope(
          connectedAccountGroupWithRequested,
          requestedCaipChainIds,
        ),
      ]),
    );

    // Determine which account groups to include based on priority and availability
    const hasPriorityGroups = prioritySupportedGroups.length > 0;
    const hasSupportedGroups = supportedAccountGroups.length > 0;

    let fallbackAccountGroups: AccountGroupWithInternalAccounts[] = [];

    if (!hasPriorityGroups && hasSupportedGroups) {
      // Only include fallback groups when there are no priority groups
      const fallbackGroup = selectedAccountGroup || supportedAccountGroups[0];
      if (fallbackGroup) {
        fallbackAccountGroups = [fallbackGroup];
      }
    }

    // Combine priority groups with fallback groups (if any) and remove duplicates
    const selectedAndRequestedAccountGroups = deduplicateAccountGroups([
      ...prioritySupportedGroups,
      ...fallbackAccountGroups,
    ]);

    return {
      selectedAndRequestedAccountGroups,
      supportedAccountGroups: [
        ...prioritySupportedGroups,
        ...supportedAccountGroups,
      ],
      connectedAccountGroups: [
        ...priorityConnectedGroups,
        ...connectedAccountGroups,
      ],
      connectedCaipAccountIds: connectedAccountIds,
      connectedAccountGroupWithRequested: deduplicateAccountGroups(
        connectedAccountGroupWithRequested,
      ),
      caipAccountIdsOfConnectedAccountGroupWithRequested,
    };
  }, [
    accountGroups,
    existingPermission,
    requestedNamespacesWithoutWallet,
    requestedCaipChainIds,
    selectedAccountGroupId,
    requestedCaipAccountIds,
  ]);

  return {
    /** Account groups that are currently connected via existing permissions */
    connectedAccountGroups: result.connectedAccountGroups,
    /** Account groups that support the requested chains/namespaces */
    supportedAccountGroups: result.supportedAccountGroups,
    /** CAIP account IDs that are already connected via existing permissions */
    existingConnectedCaipAccountIds: result.connectedCaipAccountIds,
    /** Account groups that fulfill the requested account IDs */
    connectedAccountGroupWithRequested:
      result.connectedAccountGroupWithRequested,
    /** CAIP account IDs that should be connected */
    caipAccountIdsOfConnectedAccountGroupWithRequested:
      result.caipAccountIdsOfConnectedAccountGroupWithRequested,
    /** Account groups that support the requested chains/namespaces incl the selected account group if not already requested */
    selectedAndRequestedAccountGroups: result.selectedAndRequestedAccountGroups,
  };
};
