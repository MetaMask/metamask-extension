import { InternalAccount } from '@metamask/keyring-internal-api';
import { createParameterizedSelector } from '../../../../shared/lib/selectors/selector-creators';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';

const accountSelectorFactory = createParameterizedSelector(20);

export const selectAccountGroupNameByInternalAccount = accountSelectorFactory(
  (state: MultichainAccountsState) => state,
  (_state: MultichainAccountsState, internalAccount: string | undefined) =>
    internalAccount,
  (state, internalAccount): string | null => {
    if (!internalAccount) {
      return null;
    }

    const groups = getAccountGroupsByAddress(state, [internalAccount]);
    const address = internalAccount.toLowerCase();

    if (!groups.length) {
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
