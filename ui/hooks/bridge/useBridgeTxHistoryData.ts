import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import { StatusTypes } from '@metamask/bridge-controller';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';

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
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const txMeta = transactionGroup.initialTransaction;
  const srcTxMetaId = txMeta.id;
  const bridgeHistoryItem = bridgeHistory[srcTxMetaId];

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
