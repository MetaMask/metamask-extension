import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';

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
  const srcTxMetaId = transactionGroup.initialTransaction.id;
  const bridgeHistoryItem = bridgeHistory[srcTxMetaId];

  // By complete, this means BOTH source and dest tx are confirmed
  const isBridgeComplete = bridgeHistoryItem
    ? Boolean(
        bridgeHistoryItem?.status.srcChain.txHash &&
          bridgeHistoryItem.status.destChain?.txHash,
      )
    : null;

  const showBridgeTxDetails = () => {
    history.push(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${srcTxMetaId}`);
  };

  return {
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
  };
}
