import type { AccountsControllerState } from '@metamask/accounts-controller';

export type SelectedInternalAccountState = {
  metamask: {
    internalAccounts: AccountsControllerState['internalAccounts'];
  };
};

export function getSelectedInternalAccount(
  state: SelectedInternalAccountState,
) {
  const accountId = state.metamask.internalAccounts.selectedAccount;
  return state.metamask.internalAccounts.accounts[accountId];
}
