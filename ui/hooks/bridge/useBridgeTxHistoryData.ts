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

  // If this tx is a bridge tx, it will have a bridgeHistoryItem
  const bridgeHistoryItem = srcTxHash ? bridgeHistory[srcTxHash] : undefined;

  const { destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
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

  const showBridgeTxDetails = srcTxHash
    ? () => {
        history.push(`${CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE}/${srcTxHash}`);
      }
    : null;

  return {
    bridgeTitleSuffix,
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
    showBridgeTxDetails,
  };
}
