import { InternalAccount } from '@metamask/keyring-internal-api';
import { createDeepEqualSelector } from '../../../../shared/modules/selectors/util';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';

export const selectAccountGroupNameByInternalAccount = createDeepEqualSelector(
  [
    (state: MultichainAccountsState) => state,
    (_state: MultichainAccountsState, internalAccount: string | undefined) =>
      internalAccount,
  ],
  (
    state: MultichainAccountsState,
    internalAccount: string | undefined,
  ): string | null => {
    if (!internalAccount) {
      return null;
    }
    const allAccountGroups = getAccountGroupsByAddress(state, [
      internalAccount,
    ]);
    const group = allAccountGroups.find((g: AccountGroupWithInternalAccounts) =>
      g.accounts.some(
        (a: InternalAccount) =>
          a.address?.toLowerCase() === internalAccount.toLowerCase(),
      ),
    );
    return group?.metadata?.name ?? null;
  },
);

export const selectInternalAccountNameByAddress = createDeepEqualSelector(
  [
    (state: MultichainAccountsState) => state,
    (_state: MultichainAccountsState, address: string | undefined) => address,
  ],
  (
    state: MultichainAccountsState,
    address: string | undefined,
  ): string | null => {
    if (!address) {
      return null;
    }
    const allAccountGroups = getAccountGroupsByAddress(state, [address]);
    const allInternalAccounts = allAccountGroups.flatMap(
      (g: AccountGroupWithInternalAccounts) => g.accounts,
    );
    const fromAccount = getAccountByAddress(allInternalAccounts, address);
    return fromAccount?.metadata?.name ?? null;
  },
);
