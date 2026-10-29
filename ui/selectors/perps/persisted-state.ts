/**
 * Perps persisted state selectors
 *
 * These values are stored in AppStateController (browser.storage.local)
 * and merged into state.metamask. They persist until extension uninstall.
 */

import type { MetaMaskReduxState } from '../../store/store';

/**
 * Select whether the user has seen (and dismissed) the Perps tab "New" badge.
 *
 * @param state
 */
export const getPerpsTabBadgeSeen = (state: MetaMaskReduxState): boolean =>
  state.metamask.perpsTabBadgeSeen ?? false;
