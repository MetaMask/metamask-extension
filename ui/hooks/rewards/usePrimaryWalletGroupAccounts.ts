import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { AccountGroupId, AccountWalletId } from '@metamask/account-api';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getSelectedAccount } from '../../selectors';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '../../selectors/shared';
import {
  getMultichainAccountsByWalletId,
  getWalletIdAndNameByAccountAddress,
  getInternalAccountsFromGroupById,
} from '../../selectors/multichain-accounts/account-tree';
import { MultichainAccountsState } from '../../selectors/multichain-accounts/account-tree.types';

/**
 * Hook to get accounts for the primary (first) account group in the wallet
 * of the currently selected account.
 *
 * @returns Object containing the accountGroupId and accounts array for the primary wallet group
 */
export const usePrimaryWalletGroupAccounts = (): {
  accountGroupId: AccountGroupId | undefined;
  accounts: InternalAccount[];
} => {
  const selectedAccount = useSelector(getSelectedAccount);
  const { id: walletId } = useSelector((state) =>
    getWalletIdAndNameByAccountAddress(state, selectedAccount.address),
  ) || { walletId: undefined };

  const accountGroupsByWallet = useSelector((state: MultichainAccountsState) =>
    walletId
      ? getMultichainAccountsByWalletId(state, walletId as AccountWalletId)
      : EMPTY_OBJECT,
  );

  // Get the first account group ID from the wallet (primary account group)
  const primaryAccountGroupId = useMemo(
    () =>
      accountGroupsByWallet ? Object.keys(accountGroupsByWallet)[0] : undefined,
    [accountGroupsByWallet],
  );

  // Get accounts for the primary account group
  const primaryWalletGroupAccounts = useSelector(
    (state) =>
      primaryAccountGroupId
        ? getInternalAccountsFromGroupById(
            state,
            primaryAccountGroupId as AccountGroupId,
          )
        : EMPTY_ARRAY,
    shallowEqual,
  );

  return {
    accountGroupId: primaryAccountGroupId as AccountGroupId | undefined,
    accounts: primaryWalletGroupAccounts,
  };
};
