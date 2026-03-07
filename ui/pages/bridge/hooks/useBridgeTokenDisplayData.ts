import { TransactionType } from '@metamask/transaction-controller';
import { useSelector } from 'react-redux';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';
import { type TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { getAssetImageUrl } from '../../../../shared/lib/asset-utils';
import { type MetaMaskReduxState } from '../../../selectors';
import { selectBridgeHistoryItemByHash } from '../../../ducks/bridge-status/selectors';
import { type TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';

/**
 * A Bridge transaction group's primaryTransaction contains details of the swap,
 * including the source (from) and destination (to) token type (ETH, DAI, etc..)
 *
 * @param params
 * @param params.transactionGroup - A Bridge transaction group
 * @param params.transaction - transaction view data from the Activity List v2 page
 */
export function useBridgeTokenDisplayData({
  transactionGroup,
  transaction,
}: {
  transactionGroup?: TransactionGroup;
  transaction?: TransactionViewModel & { type: TransactionType };
}) {
  const initialTransaction =
    transactionGroup?.initialTransaction || transaction;

  const bridgeHistoryItem = useSelector((state: MetaMaskReduxState) =>
    selectBridgeHistoryItemByHash(
      state,
      transactionGroup?.initialTransaction?.hash ?? transaction?.hash,
    ),
  );

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
