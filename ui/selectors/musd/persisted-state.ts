/**
 * MUSD persisted state selectors
 *
 * These values are stored in AppStateController (browser.storage.local)
 * and merged into state.metamask. They persist until extension uninstall.
 */

import type { MetaMaskReduxState } from '../../store/store';
import { EMPTY_ARRAY } from '../shared';

/**
 * Select whether the mUSD conversion education screen has been seen
 *
 * @param state
 */
export const selectMusdConversionEducationSeen = (
  state: MetaMaskReduxState,
): boolean => state.metamask.musdConversionEducationSeen ?? false;

/**
 * Select the list of dismissed mUSD asset-detail CTA keys (chainId-tokenAddress)
 *
 * @param state
 */
export const selectMusdConversionDismissedCtaKeys = (
  state: MetaMaskReduxState,
): readonly string[] =>
  state.metamask.musdConversionDismissedCtaKeys ??
  (EMPTY_ARRAY as readonly string[]);
