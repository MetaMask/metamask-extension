import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
import { getPermittedAccountsForCurrentTab } from './getPermittedAccountsForCurrentTab';

export const isAccountConnectedToCurrentTab = createDeepEqualSelector(
  getPermittedAccountsForCurrentTab,
  (_state, address) => address,
  (permittedAccounts, address) => {
    return permittedAccounts.some((account) => account === address);
  },
);
