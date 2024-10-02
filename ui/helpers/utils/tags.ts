import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  ApprovalsMetaMaskState,
  getInternalAccounts,
  getNotifications,
  getPendingApprovals,
  getTransactions,
  selectAllTokensFlat,
} from '../../selectors';
import { NftState, selectAllNftsFlat } from '../../selectors/nft';

export function getStartupTraceTags(state: any) {
  const uiType = getEnvironmentType();
  const unlocked = getIsUnlocked(state) as boolean;
  const accountCount = getInternalAccounts(state).length;
  const nftCount = selectAllNftsFlat(state as unknown as NftState).length;
  const notificationCount = getNotifications(state).length;
  const tokenCount = selectAllTokensFlat(state).length as number;
  const transactionCount = getTransactions(state).length;

  const pendingApprovals = getPendingApprovals(
    state as unknown as ApprovalsMetaMaskState,
  );

  const firstApprovalType = pendingApprovals?.[0]?.type;

  globalThis.sentry.setMeasurement('wallet.token_count_test', accountCount, 'none');

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
