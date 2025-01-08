import { isEvmAccountType } from '@metamask/keyring-api';
import { getPermittedAccountsForCurrentTab } from './permissions';
import { getMetaMaskAccountsOrdered } from './getMetaMaskAccounts';

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
