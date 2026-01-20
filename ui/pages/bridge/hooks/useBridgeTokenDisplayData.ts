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
  const { initialTransaction } = transactionGroup;

  const bridgeHistoryItemForInitialTxId = useSelector((state) =>
    selectBridgeHistoryItemForTxMetaId(state, initialTransaction.id),
  );
  const bridgeHistoryItemWithApprovalTxId = useSelector((state) =>
    selectBridgeHistoryForApprovalTxId(state, initialTransaction.id),
  );

  const bridgeHistoryItem: BridgeHistoryItem | undefined =
    bridgeHistoryItemForInitialTxId ?? bridgeHistoryItemWithApprovalTxId;

  // Display currency can be fiat or a token
  const displayCurrencyAmount = useTokenFiatAmount(
    bridgeHistoryItem?.quote.srcAsset.address ??
      initialTransaction.sourceTokenAddress,
    bridgeHistoryItem?.pricingData?.amountSent ??
      initialTransaction.sourceTokenAmount,
    bridgeHistoryItem?.quote.srcAsset.symbol ??
      initialTransaction.sourceTokenSymbol,
    {},
    true,
    initialTransaction.chainId,
  );

  return {
    category:
      initialTransaction.type === TransactionType.bridge
        ? TransactionGroupCategory.bridge
        : TransactionGroupCategory.swap,
    displayCurrencyAmount,
    sourceTokenSymbol:
      bridgeHistoryItem?.quote.srcAsset.symbol ??
      initialTransaction.sourceTokenSymbol,
    sourceTokenAmountSent:
      bridgeHistoryItem?.pricingData?.amountSent ??
      initialTransaction.sourceTokenAmount,
    destinationTokenSymbol:
      bridgeHistoryItem?.quote.destAsset.symbol ??
      initialTransaction.destinationTokenSymbol,
  };
}
