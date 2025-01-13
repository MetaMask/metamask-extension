import { getOriginOfCurrentTab } from './getMetaMaskAccounts';
import { getPermittedAccounts } from './permissions';

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
