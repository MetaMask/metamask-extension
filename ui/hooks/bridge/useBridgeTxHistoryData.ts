import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import { StatusTypes } from '@metamask/bridge-controller';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';

export const FINAL_NON_CONFIRMED_STATUSES = [
  TransactionStatus.failed,
  TransactionStatus.dropped,
  TransactionStatus.rejected,
];

export type TransactionGroup = {
  hasCancelled: boolean;
  hasRetried: boolean;
  initialTransaction: TransactionMeta;
  nonce: Hex;
  primaryTransaction: TransactionMeta;
  transactions: TransactionMeta[];
};

export type UseBridgeTxHistoryDataProps = {
  transactionGroup: TransactionGroup;
  isEarliestNonce: boolean;
};

export function useBridgeTxHistoryData({
  transactionGroup,
  isEarliestNonce,
}: UseBridgeTxHistoryDataProps) {
  const history = useHistory();
  const txMeta = transactionGroup.initialTransaction;
  const srcTxMetaId = txMeta.id;
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  // First try direct lookup by transaction ID
  let bridgeHistoryItem = srcTxMetaId ? bridgeHistory[srcTxMetaId] : undefined;

  // If not found, try to find by originalTransactionId for intent transactions
  if (!bridgeHistoryItem && srcTxMetaId) {
    const matchingEntry = Object.entries(bridgeHistory).find(
      ([_, historyItem]) => (historyItem as any).originalTransactionId === srcTxMetaId
    );
    bridgeHistoryItem = matchingEntry ? matchingEntry[1] : undefined;
  }

  // By complete, this means BOTH source and dest tx are confirmed
  const isBridgeComplete = bridgeHistoryItem
    ? Boolean(bridgeHistoryItem?.status.srcChain.txHash) &&
      bridgeHistoryItem.status.status === StatusTypes.COMPLETE
    : null;

  const isBridgeFailed = bridgeHistoryItem
    ? bridgeHistoryItem?.status.status === StatusTypes.FAILED
    : null;

  const showBridgeTxDetails = FINAL_NON_CONFIRMED_STATUSES.includes(
    txMeta.status,
  )
    ? undefined
    : () => {
        history.push({
          pathname: `${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${srcTxMetaId}`,
          state: { transactionGroup, isEarliestNonce },
        });
      };

  return {
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
    isBridgeFailed,
    showBridgeTxDetails,
  };
}
