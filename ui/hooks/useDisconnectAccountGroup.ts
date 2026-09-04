import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import {
  Caip25EndowmentPermissionName,
  getCaip25CaveatFromPermission,
  getCaipAccountIdsFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
} from '@metamask/chain-agnostic-permission';
import { getPermissionSubjects } from '../selectors';
import { getAccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree';
import { setPermittedAccounts } from '../store/actions';
import { useDispatch } from '../store/hooks';

type Caip25Permission = NonNullable<
  Parameters<typeof getCaip25CaveatFromPermission>[0]
>;

type PermissionSubjects = Record<
  string,
  { permissions?: Record<string, Caip25Permission> }
>;

/**
 * Revokes every dapp connection an account group holds, across all origins.
 *
 * @returns A callback taking the account group id to disconnect.
 */
export function useDisconnectAccountGroup() {
  const dispatch = useDispatch();
  const subjects = useSelector(getPermissionSubjects) as PermissionSubjects;
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  return useCallback(
    async (accountGroupId: AccountGroupId) => {
      const accounts =
        accountGroups.find(({ id }) => id === accountGroupId)?.accounts ?? [];

      if (accounts.length === 0) {
        return;
      }

      // Origins hold independent permissions, but every account of an origin
      // goes in a single write since each one rewrites the whole caveat.
      await Promise.all(
        Object.entries(subjects).map(async ([origin, subject]) => {
          const caveat = getCaip25CaveatFromPermission(
            subject.permissions?.[Caip25EndowmentPermissionName],
          );

          if (!caveat) {
            return;
          }

          const permittedAccountIds = getCaipAccountIdsFromCaip25CaveatValue(
            caveat.value,
          );
          const remainingAccountIds = permittedAccountIds.filter(
            (permittedAccountId) =>
              !accounts.some((account) =>
                isInternalAccountInPermittedAccountIds(account, [
                  permittedAccountId,
                ]),
              ),
          );

          if (remainingAccountIds.length === permittedAccountIds.length) {
            return;
          }

          await dispatch(setPermittedAccounts(origin, remainingAccountIds));
        }),
      );
    },
    [accountGroups, dispatch, subjects],
  );
}
