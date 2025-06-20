import { useSelector } from 'react-redux';
import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import type { TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import {
  selectBridgeHistoryForAccount,
  selectBridgeHistoryForApprovalTxId,
} from '../../../ducks/bridge-status/selectors';
/**
 * A Bridge transaction group's primaryTransaction contains details of the swap,
 * including the source (from) and destination (to) token type (ETH, DAI, etc..)
 *
 * @param transactionGroup - A Bridge transaction group
 */
export function useBridgeTokenDisplayData(transactionGroup: TransactionGroup) {
  const { primaryTransaction } = transactionGroup;
  const chainId = useSelector(getCurrentChainId);
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);

  // If the primary transaction is a bridge transaction, use the bridge history item for the primary transaction id
  // Otherwise, assume that the primary transaction is an approval transaction and use the bridge history item that has the approvalTxId
  const bridgeHistoryItemForPrimaryTxId: BridgeHistoryItem | undefined =
    bridgeHistory[primaryTransaction.id];
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
    chainId,
  );

  return {
    category: TransactionGroupCategory.bridge,
    displayCurrencyAmount:
      primaryTransaction.chainId === chainId
        ? displayCurrencyAmount
        : undefined,
    sourceTokenSymbol:
      bridgeHistoryItem?.quote.srcAsset.symbol ??
      primaryTransaction.sourceTokenSymbol,
    sourceTokenAmountSent:
      bridgeHistoryItem?.pricingData?.amountSent ??
      primaryTransaction.sourceTokenAmount,
  };
}
