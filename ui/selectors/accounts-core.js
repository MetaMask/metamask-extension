export function getPinnedAccountsList(state) {
  return state.metamask.pinnedAccountList;
}

export function getHiddenAccountsList(state) {
  return state.metamask.hiddenAccountList;
}

export function getInternalAccount(state, accountId) {
  return state.metamask.internalAccounts.accounts[accountId];
}

export function getOriginOfCurrentTab(state) {
  return state.activeTab.origin;
}
/**
 * Get account balances state.
 *
 * @param {object} state - Redux state
 * @returns {object} A map of account addresses to account objects (which includes the account balance)
 */
export function getMetaMaskAccountBalances(state) {
  return state.metamask.accounts;
}

export function getSubjectMetadata(state) {
  return state.metamask.subjectMetadata;
}

export function getMetaMaskKeyrings(state) {
  return state.metamask.keyrings;
}
