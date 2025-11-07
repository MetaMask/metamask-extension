import { useSelector } from 'react-redux';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import {
  selectBridgeHistoryForApprovalTxId,
  selectBridgeHistoryItemForTxMetaId,
} from '../../../ducks/bridge-status/selectors';

/**
 * A Bridge transaction group's primaryTransaction contains details of the swap,
 * including the source (from) and destination (to) token type (ETH, DAI, etc..)
 *
 * @param transactionGroup - A Bridge transaction group
 */
export function useBridgeTokenDisplayData(transactionGroup: TransactionGroup) {
  const { primaryTransaction } = transactionGroup;

  // If the primary transaction is a bridge transaction, use the bridge history item for the primary transaction id
  // Otherwise, assume that the primary transaction is an approval transaction and use the bridge history item that has the approvalTxId
  const bridgeHistoryItemForPrimaryTxId = useSelector((state) =>
    selectBridgeHistoryItemForTxMetaId(state, primaryTransaction.id),
  );
  const bridgeHistoryItemWithApprovalTxId = useSelector((state) =>
    selectBridgeHistoryForApprovalTxId(state, primaryTransaction.id),
  );
  const bridgeHistoryItem: BridgeHistoryItem | undefined =
    bridgeHistoryItemForPrimaryTxId ?? bridgeHistoryItemWithApprovalTxId;

  // Display currency can be fiat or a token
  const displayCurrencyAmount = useTokenFiatAmount(
    bridgeHistoryItem?.quote.srcAsset.address ??
      primaryTransaction.sourceTokenAddress,
    bridgeHistoryItem?.pricingData?.amountSent ??
      primaryTransaction.sourceTokenAmount,
    bridgeHistoryItem?.quote.srcAsset.symbol ??
      primaryTransaction.sourceTokenSymbol,
    {},
    true,
    primaryTransaction.chainId,
  );

  return {
    category:
      primaryTransaction.type === TransactionType.bridge
        ? TransactionGroupCategory.bridge
        : TransactionGroupCategory.swap,
    displayCurrencyAmount,
    sourceTokenSymbol:
      bridgeHistoryItem?.quote.srcAsset.symbol ??
      primaryTransaction.sourceTokenSymbol,
    sourceTokenAmountSent:
      bridgeHistoryItem?.pricingData?.amountSent ??
      primaryTransaction.sourceTokenAmount,
    destinationTokenSymbol:
      bridgeHistoryItem?.quote.destAsset.symbol ??
      primaryTransaction.destinationTokenSymbol,
  };
}
