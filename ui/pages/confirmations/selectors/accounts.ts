import { InternalAccount } from '@metamask/keyring-internal-api';
import { createDeepEqualSelector } from '../../../../shared/lib/selectors/util';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';

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
