import { SubjectType } from '@metamask/permission-controller';
import { memoize } from 'lodash';

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
/**
 * @param {string} svgString - The raw SVG string to make embeddable.
 * @returns {string} The embeddable SVG string.
 */
const getEmbeddableSvg = memoize(
  (svgString) => `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`,
);

export function getTargetSubjectMetadata(state, origin) {
  const metadata = getSubjectMetadata(state)[origin];

  if (metadata?.subjectType === SubjectType.Snap) {
    const { svgIcon, ...remainingMetadata } = metadata;
    return {
      ...remainingMetadata,
      iconUrl: svgIcon ? getEmbeddableSvg(svgIcon) : null,
    };
  }

  return metadata;
}
