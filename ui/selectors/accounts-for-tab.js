import { isEvmAccountType } from '@metamask/keyring-api';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { getInternalAccount, getOriginOfCurrentTab } from './accounts-core';
import { getSelectedInternalAccount } from './accounts';
import { getPermittedAccounts } from './permissions';
import { getMetaMaskAccountsOrdered } from './getMetaMaskAccountsOrdered';

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
/**
 * Selects the permitted accounts from the eth_accounts permission for the
 * origin of the current tab.
 *
 * @param {object} state - The current state.
 * @returns {Array<string>} An empty array or an array of accounts.
 */

export function getPermittedAccountsForCurrentTab(state) {
  return getPermittedAccounts(state, getOriginOfCurrentTab(state));
}
export function getOrderedConnectedAccountsForActiveTab(state) {
  const {
    activeTab,
    metamask: { permissionHistory },
  } = state;

  const permissionHistoryByAccount =
    // eslint-disable-next-line camelcase
    permissionHistory[activeTab.origin]?.eth_accounts?.accounts;
  const orderedAccounts = getMetaMaskAccountsOrdered(state);
  const connectedAccounts = getPermittedAccountsForCurrentTab(state);

  return orderedAccounts
    .filter((account) => connectedAccounts.includes(account.address))
    .filter((account) => isEvmAccountType(account.type))
    .map((account) => ({
      ...account,
      metadata: {
        ...account.metadata,
        lastActive: permissionHistoryByAccount?.[account.address],
      },
    }))
    .sort(
      ({ lastSelected: lastSelectedA }, { lastSelected: lastSelectedB }) => {
        if (lastSelectedA === lastSelectedB) {
          return 0;
        } else if (lastSelectedA === undefined) {
          return 1;
        } else if (lastSelectedB === undefined) {
          return -1;
        }

        return lastSelectedB - lastSelectedA;
      },
    );
}
export const isAccountConnectedToCurrentTab = createDeepEqualSelector(
  getPermittedAccountsForCurrentTab,
  (_state, address) => address,
  (permittedAccounts, address) => {
    return permittedAccounts.some((account) => account === address);
  },
);
