import { createSelector } from 'reselect';
import { AccountsControllerState } from '@metamask/accounts-controller';
import { getAccountName } from '../selectors';
import { getInternalAccounts } from '../accounts';
import { createDeepEqualSelector } from '../util';

/**
 * The Metamask state for the accounts controller.
 */
export type AccountsMetaMaskState = {
  metamask: AccountsControllerState;
};

/**
 * Get the account name for an address.
 *
 * @param _state -  The Metamask state for the accounts controller.
 * @param address - The address to get the display name for.
 * @returns The account name for the address.
 */
export const getAccountNameFromState = createSelector(
  [
    getInternalAccounts,
    (_state: AccountsMetaMaskState, address: string) => address,
  ],
  getAccountName,
);

/**
 * Get the memoized account name for an address.
 *
 * @param state - The Metamask state for the accounts controller.
 * @param address - The address to get the display name for.
 * @returns The account name for the address.
 */
export const getMemoizedAccountName = createDeepEqualSelector(
  [getAccountNameFromState],
  (accountName: string) => accountName,
);
