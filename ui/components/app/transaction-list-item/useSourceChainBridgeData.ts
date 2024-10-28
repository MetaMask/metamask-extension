import { useSelector } from 'react-redux';
import { Hex } from '@metamask/utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import { getNetworkConfigurationsByChainId } from '../../../selectors';

export default function useSourceChainBridgeData({
  transactionGroup,
}: {
  transactionGroup: {
    hasCancelled: boolean;
    hasRetried: boolean;
    initialTransaction: TransactionMeta;
    nonce: Hex;
    primaryTransaction: TransactionMeta;
    transactions: TransactionMeta[];
  };
}) {
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const txHash = transactionGroup.initialTransaction.hash;

  // If this tx is a bridge tx, it will have a bridgeHistoryItem
  const bridgeHistoryItem = txHash ? bridgeHistory[txHash] : undefined;

  const decDestChainId = bridgeHistoryItem?.quote.destChainId;
  const hexDestChainId = decDestChainId
    ? (new Numeric(decDestChainId, 10).toPrefixedHexString() as Hex)
    : undefined;
  const networkConfiguration = hexDestChainId
    ? networkConfigurationsByChainId[hexDestChainId]
    : undefined;
  const chainName = networkConfiguration?.name || 'Unknown';
  const bridgeTitleSuffix = bridgeHistoryItem ? ` to ${chainName}` : '';

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
      decDestChainId,
      hexDestChainId,
      networkConfigurationsByChainId,
      networkConfiguration,
      isBridgeComplete,
    });
  }

  return {
    bridgeTitleSuffix,
    bridgeTxHistoryItem: bridgeHistoryItem,
    isBridgeComplete,
  };
}
