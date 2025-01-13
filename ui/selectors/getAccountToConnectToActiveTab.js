import { getPermittedAccountsForCurrentTab } from './getPermittedAccountsForCurrentTab';
import { getInternalAccount } from './getMetaMaskAccounts';
import { getSelectedInternalAccount } from './accounts';

export function getAccountToConnectToActiveTab(state) {
  const selectedInternalAccount = getSelectedInternalAccount(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

  const {
    metamask: {
      internalAccounts: { accounts },
    },
  } = state;
  const numberOfAccounts = Object.keys(accounts).length;

  if (
    connectedAccounts.length &&
    connectedAccounts.length !== numberOfAccounts
  ) {
    if (
      connectedAccounts.findIndex(
        (address) => address === selectedInternalAccount.address,
      ) === -1
    ) {
      return getInternalAccount(state, selectedInternalAccount.id);
    }
  }

  return undefined;
}
