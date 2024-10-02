import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { getIsUnlocked } from '../../ducks/metamask/metamask';
import {
  ApprovalsMetaMaskState,
  getInternalAccounts,
  getPendingApprovals,
  getTransactions,
  selectAllTokensFlat,
} from '../../selectors';
import { getMetamaskNotifications } from '../../selectors/metamask-notifications/metamask-notifications';
import { NftState, selectAllNftsFlat } from '../../selectors/nft';

export function getStartupTraceTags(state: any) {
  const uiType = getEnvironmentType();
  const unlocked = getIsUnlocked(state) as boolean;
  const accountCount = getInternalAccounts(state).length;
  const nftCount = selectAllNftsFlat(state as unknown as NftState).length;
  const notificationCount = getMetamaskNotifications(state).length;
  const tokenCount = selectAllTokensFlat(state).length as number;
  const transactionCount = getTransactions(state).length;

  const pendingApprovals = getPendingApprovals(
    state as unknown as ApprovalsMetaMaskState,
  );

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
