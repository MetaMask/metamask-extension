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
