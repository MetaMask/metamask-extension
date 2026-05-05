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

// Helper to serialize for navigation.
// TODO: Fetch details from CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE instead.
function serialize(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serialize);
  }
  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        serialized[key] = serialize((obj as Record<string, unknown>)[key]);
      }
    }
    return serialized;
  }
  return obj;
}

export function useBridgeTxHistoryData({
  // Used in legacy transaction list
  transactionGroup,
  // Used in activity list v2
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
  // Intent bridge history is keyed by order UID, so activity rows need a
  // fallback lookup by the original tx meta id instead of tx hash alone.
  const bridgeHistoryItem =
    bridgeHistoryItemByHash ?? bridgeHistoryItemByOriginalTxMetaId;
  const isApprovalTransaction =
    Boolean(bridgeHistoryItem?.approvalTxId) &&
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
    const txIdentifier = txMeta?.hash ?? txMeta?.id;

    if (!txIdentifier) {
      return;
    }

    const serializedTxMeta = serialize(txMeta);
    navigate(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${txIdentifier}`, {
      state: {
        transaction: serializedTxMeta,
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
