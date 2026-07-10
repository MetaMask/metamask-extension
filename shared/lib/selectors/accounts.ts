import type { AccountsControllerState } from '@metamask/accounts-controller';
import { createSelector } from 'reselect';

export type AccountsState = {
  metamask: AccountsControllerState;
};

const selectInternalAccounts = (state: AccountsState) =>
  state.metamask.internalAccounts.accounts;

const selectSelectedInternalAccountId = (state: AccountsState) =>
  state.metamask.internalAccounts.selectedAccount;

export const getSelectedInternalAccount = createSelector(
  [selectSelectedInternalAccountId, selectInternalAccounts],
  (accountId, accounts) => accounts[accountId],
);

/**
 * Same as `getSelectedInternalAccount`, but might potentially be `undefined`:
 * - This might happen during the onboarding
 *
 * @param state - The accounts state
 * @returns The selected internal account or undefined
 */
export function getMaybeSelectedInternalAccount(state: AccountsState) {
  const accountId = state.metamask.internalAccounts?.selectedAccount;
  return accountId
    ? state.metamask.internalAccounts?.accounts[accountId]
    : undefined;
}
