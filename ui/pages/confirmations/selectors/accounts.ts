import { InternalAccount } from '@metamask/keyring-internal-api';
import { createParameterizedSelector } from '../../../../shared/lib/selectors/selector-creators';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import {
  AccountGroupWithInternalAccounts,
  MultichainAccountsState,
} from '../../../selectors/multichain-accounts/account-tree.types';

const accountSelectorFactory = createParameterizedSelector(20);

export const selectAccountGroupNameByInternalAccount = accountSelectorFactory(
  (state: MultichainAccountsState, internalAccount: string | undefined) => {
    if (!internalAccount) {
      return null;
    }
    return getAccountGroupsByAddress(state, [internalAccount]);
  },
  (_state: MultichainAccountsState, internalAccount: string | undefined) =>
    internalAccount?.toLowerCase() ?? null,
  (groups, address): string | null => {
    if (!address || !groups?.length) {
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
