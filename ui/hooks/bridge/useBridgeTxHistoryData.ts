import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import {
  TransactionMeta,
  TransactionStatus,
} from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';

export const FINAL_NON_CONFIRMED_STATUSES = [
  TransactionStatus.failed,
  TransactionStatus.dropped,
  TransactionStatus.rejected,
];

export type UseBridgeDataProps = {
  transactionGroup: {
    hasCancelled: boolean;
    hasRetried: boolean;
    initialTransaction: TransactionMeta;
    nonce: Hex;
    primaryTransaction: TransactionMeta;
    transactions: TransactionMeta[];
  };
};

export default function useBridgeTxHistoryData({
  transactionGroup,
}: UseBridgeDataProps) {
  const history = useHistory();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const txMeta = transactionGroup.initialTransaction;
  const srcTxMetaId = txMeta.id;
  const bridgeHistoryItem = bridgeHistory[srcTxMetaId];

  // By complete, this means BOTH source and dest tx are confirmed
  const isBridgeComplete = bridgeHistoryItem
    ? Boolean(
        bridgeHistoryItem?.status.srcChain.txHash &&
          bridgeHistoryItem.status.destChain?.txHash,
      )
    : null;

  const showBridgeTxDetails = FINAL_NON_CONFIRMED_STATUSES.includes(
    txMeta.status,
  )
    ? undefined
    : () => {
        history.push(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${srcTxMetaId}`);
      };

  return {
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
  };
}
