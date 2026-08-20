import { useSelector } from 'react-redux';
import { type MetaMaskReduxState } from '../../selectors';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import {
  selectBridgeHistoryForOriginalTxMetaId,
  selectBridgeHistoryItemByHash,
} from '../../ducks/bridge-status/selectors';

export type UseBridgeTxHistoryDataProps = {
  transactionGroup: TransactionGroup;
};

export function useBridgeTxHistoryData({
  transactionGroup,
}: UseBridgeTxHistoryDataProps) {
  const txMeta = transactionGroup.initialTransaction;

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

  return {
    bridgeHistoryItem,
  };
}
