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
import {
  selectBridgeHistoryItemForApprovalTxHash,
  selectBridgeHistoryItemForTxHash,
} from '../../ducks/bridge-status/selectors';
import { TransactionViewModel } from '../../../shared/lib/multichain/types';
import { MetaMaskReduxState } from '../../selectors';

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

  const bridgeHistoryItemForInitialTx = useSelector(
    (state: MetaMaskReduxState) =>
      selectBridgeHistoryItemForTxHash(state, txMeta?.hash),
  );
  const bridgeHistoryItemForApprovalTx = useSelector(
    (state: MetaMaskReduxState) =>
      selectBridgeHistoryItemForApprovalTxHash(state, txMeta?.hash),
  );
  const bridgeHistoryItem =
    bridgeHistoryItemForInitialTx ?? bridgeHistoryItemForApprovalTx;

  const isBridgeFailed = bridgeHistoryItem
    ? bridgeHistoryItem?.status.status === StatusTypes.FAILED
    : null;

  const shouldShowBridgeTxDetails =
    bridgeHistoryItem ||
    txMeta?.type === TransactionType.bridge ||
    txMeta?.type === TransactionType.swap;

  const showBridgeTxDetails = useCallback(() => {
    {
      navigate(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${txMeta?.hash}`, {
        state: {
          transaction: txMeta,
        },
      });
    }
  }, [txMeta, shouldShowBridgeTxDetails]);

  return {
    bridgeHistoryItem,
    // By complete, this means BOTH source and dest tx are confirmed
    isBridgeComplete: bridgeHistoryItem
      ? isBridgeComplete(bridgeHistoryItem)
      : null,
    isBridgeFailed,
    showBridgeTxDetails: shouldShowBridgeTxDetails
      ? showBridgeTxDetails
      : undefined,
  };
}
