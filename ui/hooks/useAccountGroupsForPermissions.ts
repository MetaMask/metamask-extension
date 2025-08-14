import { useSelector } from 'react-redux';
import {
  Caip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import {
  CaipAccountId,
  CaipChainId,
  CaipNamespace,
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { useMemo } from 'react';
import { AccountGroupObject } from '@metamask/account-tree-controller';
import {
  getAccountGroupsByScopes,
  getCaip25AccountIdToMultichainAccountGroupMap,
  getAccountGroupWithInternalAccounts,
} from '../selectors/multichain-accounts/account-tree';
import { AccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree.types';

export const useAccountGroupsForPermissions = (
  existingPermission: Caip25CaveatValue,
  requestedCaipChainIds: CaipChainId[],
  requestedNamespacesWithoutWallet: CaipNamespace[],
) => {
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const caip25ToAccountGroupMap = useSelector(
    getCaip25AccountIdToMultichainAccountGroupMap,
  );

  // Calculate deduplicated EVM chains for selector dependency
  const deduplicatedEvmChains = useMemo(() => {
    return Array.from(
      new Set(
        requestedCaipChainIds.map((chainId) => {
          return parseCaipChainId(chainId).namespace ===
            KnownCaipNamespace.Eip155
            ? (`${KnownCaipNamespace.Eip155}:0` as CaipChainId)
            : chainId;
        }),
      ),
    );
  }, [requestedCaipChainIds]);

  // Get multichain account groups by scopes (always call useSelector at top level)
  const multichainAccountGroups = useSelector((state) =>
    getAccountGroupsByScopes(state, deduplicatedEvmChains),
  );

  const supportedAccountGroups = useMemo(() => {
    if (requestedCaipChainIds.length) {
      return multichainAccountGroups;
    }

    // Early return if no namespaces requested
    if (requestedNamespacesWithoutWallet.length === 0) {
      return [];
    }

    const namespaceSet = new Set(requestedNamespacesWithoutWallet);

    return accountGroups.filter((accountGroup) => {
      for (const account of accountGroup.accounts) {
        for (const scope of account.scopes) {
          const scopeNamespace = scope.split(':')[0];
          if (namespaceSet.has(scopeNamespace as CaipNamespace)) {
            return true;
          }
        }
      }
      return false; // No matching scopes found
    });
  }, [
    requestedCaipChainIds,
    multichainAccountGroups,
    accountGroups,
    requestedNamespacesWithoutWallet,
  ]);

  const { connectedAccountGroups, connectedCaipAccountIds } = useMemo(() => {
    // need to convert all eip155 chain ids to wildcard
    const connectedAccountIds =
      getCaipAccountIdsFromCaip25CaveatValue(existingPermission);

    const connectedAccountGroupsSet =
      new Set<AccountGroupWithInternalAccounts>();

    connectedAccountIds.forEach((caipAccountId) => {
      try {
        const {
          address,
          chain: { namespace },
        } = parseCaipAccountId(caipAccountId);

        const caip25IdToUse: CaipAccountId =
          namespace === KnownCaipNamespace.Eip155
            ? `${KnownCaipNamespace.Eip155}:0:${address}`
            : caipAccountId;

        const accountGroupId: AccountGroupObject['id'] | undefined =
          caip25ToAccountGroupMap.get(caip25IdToUse);

        if (accountGroupId) {
          const accountGroup = accountGroups.find(
            (group) => group.id === accountGroupId,
          );
          if (accountGroup) {
            connectedAccountGroupsSet.add(accountGroup);
          }
        }
      } catch (error) {
        // Skip malformed CAIP account IDs
      }
    });

    return {
      connectedAccountGroups: Array.from(connectedAccountGroupsSet),
      connectedCaipAccountIds: connectedAccountIds,
    };
  }, [existingPermission, accountGroups, caip25ToAccountGroupMap]);

  return {
    connectedAccountGroups,
    supportedAccountGroups,
    existingConnectedCaipAccountIds: connectedCaipAccountIds,
  };
};
