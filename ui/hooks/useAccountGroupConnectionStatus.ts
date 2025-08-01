import { useSelector } from 'react-redux';
import {
  getMultichainAccountGroupsByScopes,
  getCaip25AccountIdToMultichainAccountGroupMap,
  getAccountGroupWithInternalAccounts,
  AccountGroupWithInternalAccounts,
} from '../selectors/multichain-accounts/account-tree';
import {
  Caip25CaveatValue,
  getCaipAccountIdsFromCaip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import {
  CaipAccountId,
  CaipChainId,
  KnownCaipNamespace,
  parseCaipAccountId,
  parseCaipChainId,
} from '@metamask/utils';
import { useMemo } from 'react';
import { AccountGroupObject } from '@metamask/account-tree-controller';

export const useAccountGroupConnectionStatus = (
  existingPermission: Caip25CaveatValue,
  requestedCaipChainIds: CaipChainId[],
) => {
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  const caip25ToAccountGroupMap = useSelector(
    getCaip25AccountIdToMultichainAccountGroupMap,
  );

  // Extract EVM chains for selector
  const deduplicatedEvmChains = useMemo(() => {
    return Array.from(
      new Set(
        requestedCaipChainIds.filter((chainId) => {
          const { namespace } = parseCaipChainId(chainId);
          return namespace === KnownCaipNamespace.Eip155;
        }),
      ),
    );
  }, [requestedCaipChainIds]);

  const supportedAccountGroups = useSelector((state) =>
    getMultichainAccountGroupsByScopes(state, deduplicatedEvmChains),
  );

  const { connectedAccountGroups, connectedCaipAccountIds } = useMemo(() => {
    // need to convert all eip155 chain ids to wildcard
    const connectedCaipAccountIds =
      getCaipAccountIdsFromCaip25CaveatValue(existingPermission);

    const connectedAccountGroups = new Set<AccountGroupWithInternalAccounts>();

    connectedCaipAccountIds.forEach((caipAccountId) => {
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
          connectedAccountGroups.add(accountGroup);
        }
      }
    });

    return { connectedAccountGroups, connectedCaipAccountIds };
  }, [existingPermission, accountGroups, caip25ToAccountGroupMap]);

  return {
    connectedAccountGroups,
    supportedAccountGroups,
    existingConnectedCaipAccountIds: connectedCaipAccountIds,
  };
};
