import { MetaMaskReduxState } from '../../../store/store';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getAccountTrackerControllerAccountsByChainId } from '../../../../shared/lib/selectors/assets-migration';

/**
 * Whether to show the one-time Arc usage notice: any account holds a non-zero
 * native USDC balance on Arc and the notice has not been shown yet.
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

  const arcAccounts =
    getAccountTrackerControllerAccountsByChainId(state)[CHAIN_IDS.ARC] ?? {};

  return Object.values(arcAccounts).some(
    ({ balance }) => Boolean(balance) && BigInt(balance) > 0n,
  );
}
