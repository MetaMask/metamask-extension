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
    (_state: MultichainAccountsState, addresses: string[]) => addresses,
    (
      _state: MultichainAccountsState,
      _addresses: string[],
      internalAccount: string | undefined,
    ) => internalAccount,
  ],
  (
    state: MultichainAccountsState,
    addresses: string[],
    internalAccount: string | undefined,
  ): string | null => {
    if (!internalAccount || !addresses?.length) {
      return null;
    }

    const allAccountGroups = getAccountGroupsByAddress(state, addresses);

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
    (_state: MultichainAccountsState, addresses: string[]) => addresses,
    (
      _state: MultichainAccountsState,
      _addresses: string[],
      address: string | undefined,
    ) => address,
  ],
  (
    state: MultichainAccountsState,
    addresses: string[],
    address: string | undefined,
  ): string | null => {
    if (!address || !addresses?.length) {
      return null;
    }

    const allAccountGroups = getAccountGroupsByAddress(state, addresses);
    const allInternalAccounts = allAccountGroups.flatMap(
      (g: AccountGroupWithInternalAccounts) => g.accounts,
    );
    const fromAccount = getAccountByAddress(allInternalAccounts, address);

    return fromAccount?.metadata?.name ?? null;
  },
);
