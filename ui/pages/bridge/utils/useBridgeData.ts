import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useHistory } from 'react-router-dom';
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import { getNetworkConfigurationsByChainId } from '../../../selectors';
import { CROSS_CHAIN_SWAP_TX_DETAILS_ROUTE } from '../../../helpers/constants/routes';
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

export default function useBridgeData({
  transactionGroup,
}: UseBridgeDataProps) {
  const history = useHistory();
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  const srcTxHash = transactionGroup.initialTransaction.hash;

  // If this tx is a bridge tx, it will have a bridgeHistoryItem
  const bridgeHistoryItem = srcTxHash ? bridgeHistory[srcTxHash] : undefined;

  const { destNetworkConfiguration } = useBridgeChainInfo({
    bridgeHistoryItem,
  });

  const destChainName = destNetworkConfiguration?.name || 'Unknown';
  const bridgeTitleSuffix = bridgeHistoryItem ? ` to ${destChainName}` : '';

  // By complete, this means BOTH source and dest tx are confirmed
  const isBridgeComplete = bridgeHistoryItem
    ? Boolean(
        bridgeHistoryItem?.status?.srcChain.txHash &&
          bridgeHistoryItem.status.destChain?.txHash,
      )
    : null;

  if (bridgeHistoryItem && isBridgeComplete === false) {
    let logTitle;
    if (bridgeHistoryItem?.status) {
      logTitle = `transactionGroup BRIDGE STATUS${transactionGroup.initialTransaction.hash}`;
    } else {
      logTitle = `transactionGroup${transactionGroup.initialTransaction.hash}`;
    }
    console.log(logTitle, {
      transactionGroup,
      bridgeTxHistory: bridgeHistory,
      bridgeTxHistoryItem: bridgeHistoryItem,
      networkConfigurationsByChainId,
      destNetworkConfiguration,
      isBridgeComplete,
    });
  }

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
