import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { type Hex } from '@metamask/utils';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { useNavigate } from 'react-router-dom';
import { StatusTypes } from '@metamask/bridge-controller';
import { isBridgeComplete } from '../../../shared/lib/bridge-status/utils';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';
import { TransactionViewModel } from '../../../shared/lib/multichain/types';
import { MetaMaskReduxState } from '../../selectors';
import {
  selectBridgeHistoryForOriginalTxMetaId,
  selectBridgeHistoryItemByHash,
  selectLocalTxForTxHash,
} from '../../ducks/bridge-status/selectors';

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
  transactionGroup?: TransactionGroup;
  transaction?: TransactionViewModel & { type: TransactionType };
};

export function useBridgeTxHistoryData({
  transactionGroup,
  transaction: transactionViewData,
}: UseBridgeTxHistoryDataProps) {
  const navigate = useNavigate();

  const txMeta = transactionGroup?.initialTransaction ?? transactionViewData;

  const localTx = useSelector((state: MetaMaskReduxState) =>
    selectLocalTxForTxHash(state, txMeta?.hash),
  );
  const bridgeHistoryItemByHash = useSelector((state: MetaMaskReduxState) =>
    selectBridgeHistoryItemByHash(state, txMeta?.hash),
  );
  const bridgeHistoryItemByOriginalTxMetaId = useSelector(
    (state: MetaMaskReduxState) =>
      selectBridgeHistoryForOriginalTxMetaId(state, txMeta?.id),
  );
  const bridgeHistoryItem =
    bridgeHistoryItemByHash ?? bridgeHistoryItemByOriginalTxMetaId;
  const isApprovalTransaction =
    Boolean(bridgeHistoryItem) &&
    (bridgeHistoryItem?.approvalTxId === localTx?.id ||
      bridgeHistoryItem?.approvalTxId === txMeta?.id);
  const displayBridgeHistoryItem = isApprovalTransaction
    ? undefined
    : bridgeHistoryItem;

  const isBridgeFailed = displayBridgeHistoryItem
    ? displayBridgeHistoryItem?.status.status === StatusTypes.FAILED
    : null;

  const shouldShowBridgeTxDetails =
    displayBridgeHistoryItem ||
    txMeta?.type === TransactionType.bridge ||
    txMeta?.type === TransactionType.swap;

  const showBridgeTxDetails = useCallback(() => {
    navigate(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${txMeta?.hash}`, {
      state: {
        transaction: txMeta,
      },
    });
  }, [navigate, txMeta]);

  return {
    // By complete, this means BOTH source and dest tx are confirmed
    isBridgeComplete: displayBridgeHistoryItem
      ? isBridgeComplete(displayBridgeHistoryItem)
      : null,
    isBridgeFailed,
    showBridgeTxDetails: shouldShowBridgeTxDetails
      ? showBridgeTxDetails
      : undefined,
  };
}
