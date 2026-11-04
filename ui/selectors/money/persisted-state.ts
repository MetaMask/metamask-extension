import type { MetaMaskReduxState } from '../../store/store';
import { EMPTY_ARRAY } from '../shared';

/**
 * Selects the `chainId:address` keys of tokens whose Money earn banner was
 * dismissed. Stored in AppStateController until uninstall.
 *
 * @param state - The MetaMask state object.
 * @returns The dismissed token keys.
 */
export const selectMoneyEarnBannerDismissedTokenKeys = (
  state: MetaMaskReduxState,
): readonly string[] =>
  state.metamask.moneyEarnBannerDismissedTokenKeys ??
  (EMPTY_ARRAY as readonly string[]);

/**
 * Selects whether the Money account FTUE splash has been seen. Stored in
 * AppStateController until uninstall.
 *
 * @param state - The MetaMask state object.
 * @returns Whether the Money FTUE splash has been seen.
 */
export const selectMoneyFtueSeen = (state: MetaMaskReduxState): boolean =>
  Boolean(state.metamask.moneyFtueSeen);
