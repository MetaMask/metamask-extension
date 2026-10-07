import { MetaMaskReduxState } from '../../../store/store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getTokenBalancesControllerTokenBalances } from '../../../../shared/lib/selectors/assets-migration';

const hasNonZeroBalance = (balance?: string) =>
  balance ? BigInt(balance) > 0n : false;

/**
 * Whether to show the one-time Arc usage notice: any account holds a non-zero
 * balance of any asset on Arc and the notice has not been shown yet.
 *
 * @param state - Redux state object.
 * @returns True if the toast should be shown.
 */
export function selectShowArcUsageNoticeToast(
  state: MetaMaskReduxState,
): boolean {
  if (state.metamask.arcUsageNoticeShown) {
    return false;
  }

  const tokenBalances = getTokenBalancesControllerTokenBalances(state);

  return Object.values(tokenBalances).some((chains) =>
    Object.values(chains[CHAIN_IDS.ARC] ?? {}).some(hasNonZeroBalance),
  );
}
