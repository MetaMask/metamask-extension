// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  getInternalAccounts,
  getPendingApprovals,
  getTransactions,
  selectAllTokensFlat,
} from '../../selectors';
import { getMetamaskNotifications } from '../../selectors/metamask-notifications/metamask-notifications';
import { selectAllNftsFlat } from '../../selectors/nft';
import { MetaMaskReduxState } from '../../store/store';

/**
 * Generate the required tags for the UI startup trace.
 *
 * @param state - The current flattened UI state.
 * @returns The tags for the startup trace.
 */
export function getStartupTraceTags(state: MetaMaskReduxState) {
  const uiType = getEnvironmentType();
  const unlocked = getIsUnlocked(state) as boolean;
  const accountCount = getInternalAccounts(state).length;
  const nftCount = selectAllNftsFlat(state).length;
  const notificationCount = getMetamaskNotifications(state).length;
  const tokenCount = selectAllTokensFlat(state).length as number;
  const transactionCount = getTransactions(state).length;
  const pendingApprovals = getPendingApprovals(state);
  const firstApprovalType = pendingApprovals?.[0]?.type;

  return {
    'wallet.account_count': accountCount,
    'wallet.nft_count': nftCount,
    'wallet.notification_count': notificationCount,
    'wallet.pending_approval': firstApprovalType,
    'wallet.token_count': tokenCount,
    'wallet.transaction_count': transactionCount,
    'wallet.unlocked': unlocked,
    'wallet.ui_type': uiType,
  };
}
