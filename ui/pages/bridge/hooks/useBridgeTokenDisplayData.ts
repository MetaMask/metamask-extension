import { TransactionType } from '@metamask/transaction-controller';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import {
  useBridgeTxHistoryData,
  type TransactionGroup,
} from '../../../hooks/bridge/useBridgeTxHistoryData';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';

/**
 * A Bridge transaction group's primaryTransaction contains details of the swap,
 * including the source (from) and destination (to) token type (ETH, DAI, etc..)
 *
 * @param transactionGroup - A Bridge transaction group
 * @param transaction - transaction view data from the Activity List v2 page
 */
export function useBridgeTokenDisplayData(
  transactionGroup?: TransactionGroup,
  transaction?: TransactionViewModel,
) {
  const initialTransaction =
    transactionGroup?.initialTransaction || transaction;

  const { bridgeTxHistoryItem: bridgeHistoryItem } = useBridgeTxHistoryData({
    transactionGroup,
    transaction: transaction as TransactionViewModel,
  });

  // Display currency can be fiat or a token
  const displayCurrencyAmount = useTokenFiatAmount(
    bridgeHistoryItem?.quote.srcAsset.address ??
      initialTransaction?.sourceTokenAddress,
    bridgeHistoryItem?.pricingData?.amountSent ??
      initialTransaction?.sourceTokenAmount,
    bridgeHistoryItem?.quote.srcAsset.symbol ??
      initialTransaction?.sourceTokenSymbol,
    {},
    true,
    initialTransaction?.chainId,
  );

  return {
    category:
      initialTransaction?.type === TransactionType.bridge
        ? TransactionGroupCategory.bridge
        : TransactionGroupCategory.swap,
    displayCurrencyAmount,
    sourceTokenSymbol:
      bridgeHistoryItem?.quote.srcAsset.symbol ??
      transaction?.amounts?.from?.token.symbol ??
      initialTransaction?.sourceTokenSymbol,
    sourceTokenAmountSent:
      bridgeHistoryItem?.pricingData?.amountSent ??
      initialTransaction?.sourceTokenAmount,
    sourceTokenIconUrl:
      bridgeHistoryItem?.quote.srcAsset.iconUrl ??
      (transaction &&
        transaction.amounts?.from?.token.address &&
        getAssetImageUrl(
          transaction.amounts?.from?.token.address,
          transaction.chainId,
        )),
    destinationTokenSymbol:
      bridgeHistoryItem?.quote.destAsset.symbol ??
      initialTransaction?.destinationTokenSymbol ??
      (transaction && transaction.type === TransactionType.swap
        ? (transaction.amounts?.to?.token.symbol ??
          transaction.destinationTokenSymbol)
        : undefined),
    destinationTokenIconUrl:
      bridgeHistoryItem?.quote.destAsset.iconUrl ??
      (transaction && transaction.type === TransactionType.swap
        ? transaction.amounts?.to?.token.address &&
          getAssetImageUrl(
            transaction.amounts?.to?.token.address,
            transaction.chainId,
          )
        : undefined),
  };
}
