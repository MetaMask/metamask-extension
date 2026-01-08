import { InternalAccount } from '@metamask/keyring-internal-api';
import { createDeepEqualSelector } from '../../../../shared/modules/selectors/util';
import { getAccountByAddress } from '../../../helpers/utils/util';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';
import { accountsWithSendEtherInfoSelector } from '../../../selectors';
import { RootState } from './preferences';

export const selectAccountGroupNameByInternalAccount = createDeepEqualSelector(
  [
    (state: MultichainAccountsState, internalAccount: string | undefined) => {
      if (!internalAccount) {
        return { groups: [], address: null };
      }

      return {
        groups: getAccountGroupsByAddress(state, [internalAccount]),
        address: internalAccount?.toLowerCase(),
      };
    },
  ],
  ({ groups, address }): string | null => {
    if (!address || !groups.length) {
      return null;
    }

    const group = groups.find((g: AccountGroupWithInternalAccounts) =>
      g.accounts.some(
        (a: InternalAccount) => a.address?.toLowerCase() === address,
      ),
    );

    return group?.metadata?.name ?? null;
  },
);

export const selectInternalAccountNameByAddress = createDeepEqualSelector(
  [
    (state: RootState, address: string | undefined) => ({
      accounts: accountsWithSendEtherInfoSelector(state),
      address,
    }),
  ],
  ({ accounts, address }): string | null => {
    if (!address || !accounts?.length) {
      return null;
    }

    const fromAccount = getAccountByAddress(accounts, address);

    return fromAccount?.metadata?.name ?? null;
  },
);
