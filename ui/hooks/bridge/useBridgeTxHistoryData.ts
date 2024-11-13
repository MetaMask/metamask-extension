import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import { selectBridgeHistoryForAccount } from '../../ducks/bridge-status/selectors';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../useI18nContext';
import useBridgeChainInfo from './useBridgeChainInfo';

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
  const t = useI18nContext();
  const history = useHistory();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  const srcTxHash = transactionGroup.initialTransaction.hash;

  // If this tx is a bridge tx and not a smart transaction, it will always have a bridgeHistoryItem
  const bridgeHistoryItem = srcTxHash ? bridgeHistory[srcTxHash] : undefined;

  const { destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    srcTxMeta: transactionGroup.initialTransaction,
  });

  const destChainName = destNetwork?.name;
  const bridgeTitleSuffix = destChainName
    ? t('bridgeToChain', [destChainName])
    : '';

  // By complete, this means BOTH source and dest tx are confirmed
  const isBridgeComplete = bridgeHistoryItem
    ? Boolean(
        bridgeHistoryItem?.status.srcChain.txHash &&
          bridgeHistoryItem.status.destChain?.txHash,
      )
    : null;

  // We should be able to use a srcTxHash or a txMeta.id, STX won't have txHash right away
  // the txMeta.id is just a fallback, we prefer using srcTxHash
  const srcTxHashOrTxId = srcTxHash || transactionGroup.initialTransaction.id;

  const showBridgeTxDetails = () => {
    history.push(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${srcTxHashOrTxId}`);
  };

  return {
    bridgeTitleSuffix,
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
  };
}
