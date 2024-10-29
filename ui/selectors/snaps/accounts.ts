import { createSelector } from 'reselect';
import { getAccountName, getInternalAccounts } from '../selectors';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { createDeepEqualSelector } from '../util';

export type AccountsMetaMaskState = {
  metamask: AccountsControllerState;
};

export const getAccountNameFromState = createSelector(
  [
    getInternalAccounts,
    (_state: AccountsMetaMaskState, address: string) => address,
  ],
  getAccountName,
);

export const getMemoizedAccountName = createDeepEqualSelector(
  [getAccountNameFromState],
  (accountName: string) => accountName,
);
