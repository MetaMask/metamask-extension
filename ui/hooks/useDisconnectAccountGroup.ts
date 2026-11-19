import { useCallback } from 'react';
import { useSelector, useStore } from 'react-redux';
import { AccountGroupId } from '@metamask/account-api';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import {
  Caip25EndowmentPermissionName,
  getCaip25CaveatFromPermission,
  getCaipAccountIdsFromCaip25CaveatValue,
  isInternalAccountInPermittedAccountIds,
} from '@metamask/chain-agnostic-permission';
import { getPermissionSubjects } from '../selectors';
import { getAccountGroupWithInternalAccounts } from '../selectors/multichain-accounts/account-tree';
import { removePermittedAccount } from '../store/actions';
import { useDispatch } from '../store/hooks';
import type { MetaMaskReduxState } from '../store/types';

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
  const store = useStore<MetaMaskReduxState>();
  const accountGroups = useSelector(getAccountGroupWithInternalAccounts);

  return useCallback(
    async (accountGroupId: AccountGroupId) => {
      const accounts =
        accountGroups.find(({ id }) => id === accountGroupId)?.accounts ?? [];

      if (accounts.length === 0) {
        return;
      }

      // Permissions are read again for every account rather than snapshotted:
      // another group may be disconnecting at the same time, and each write
      // rewrites the whole caveat, so a stale list would reconnect its accounts.
      const findPermittedOrigins = (account: InternalAccount) => {
        const subjects = getPermissionSubjects(
          store.getState(),
        ) as PermissionSubjects;

        return Object.entries(subjects)
          .filter(([, subject]) => {
            const caveat = getCaip25CaveatFromPermission(
              subject.permissions?.[Caip25EndowmentPermissionName],
            );

            return (
              caveat !== undefined &&
              isInternalAccountInPermittedAccountIds(
                account,
                getCaipAccountIdsFromCaip25CaveatValue(caveat.value),
              )
            );
          })
          .map(([origin]) => origin);
      };

      // Accounts are removed one at a time so the background recomputes the
      // remaining accounts of the origin from current state on every removal.
      for (const account of accounts) {
        for (const origin of findPermittedOrigins(account)) {
          await dispatch(removePermittedAccount(origin, account.address));
        }
      }
    },
    [accountGroups, dispatch, store],
  );
}
