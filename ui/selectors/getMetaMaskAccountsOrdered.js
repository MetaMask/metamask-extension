import { createSelector } from 'reselect';
import {
  getInternalAccountsSortedByKeyring,
  getMetaMaskAccounts,
} from './getMetaMaskAccounts';

/**
 *  @typedef {import('./selectors.types').InternalAccountWithBalance} InternalAccountWithBalance
 */
/**
 * Get ordered (by keyrings) accounts with InternalAccount and balance
 *
 * @returns {InternalAccountWithBalance} An array of internal accounts with balance
 */
export const getMetaMaskAccountsOrdered = createSelector(
  getInternalAccountsSortedByKeyring,
  getMetaMaskAccounts,
  (internalAccounts, accounts) => {
    return internalAccounts.map((internalAccount) => ({
      ...internalAccount,
      ...accounts[internalAccount.address],
    }));
  },
);
