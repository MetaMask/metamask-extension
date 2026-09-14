import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPayRequiredToken } from '@metamask/transaction-pay-controller';
import type { Hex } from '@metamask/utils';
import {
  selectTransactionPayIntentByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { setSolanaPaySource } from '../../../../store/controller-actions/transaction-pay-controller';
import { getSolanaSourceAmount } from '../../utils/transaction-pay';
import { useConfirmContext } from '../../context/confirm';
import type { Asset } from '../../types/send';

/**
 * Refreshes the exact-input Solana Relay quote when the destination amount
 * changes. The durable intent survives restart while the instruction payload
 * does not, so this also reconstructs the transient quote on confirmation load.
 * @param tokens
 * @param requiredToken
 */
export function useRefreshSolanaPayQuote(
  tokens: Asset[],
  requiredToken: TransactionPayRequiredToken | undefined,
): void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const payIntent = useSelector((state: TransactionPayState) =>
    selectTransactionPayIntentByTransactionId(state, transactionId),
  );
  const sourceAccountId = payIntent?.sourceAccountId;
  const sourceAssetId = payIntent?.sourceAssetId;
  const sourceToken = tokens.find(
    (token) =>
      token.assetId === sourceAssetId &&
      `${String(token.chainId)}:${token.accountAddress}` === sourceAccountId,
  );
  const sourceAmount = sourceToken
    ? getSolanaSourceAmount(sourceToken, requiredToken?.amountUsd ?? '0')
    : undefined;
  const destinationChainId = requiredToken?.chainId;
  const destinationCurrency = requiredToken?.address;
  const recipient = currentConfirmation?.txParams.from;

  useEffect(() => {
    if (
      !sourceAccountId ||
      !sourceAssetId ||
      !sourceAmount ||
      !destinationChainId ||
      !destinationCurrency ||
      !recipient
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSolanaPaySource({
        transactionId,
        sourceAccountId,
        sourceAssetId,
        amount: sourceAmount,
        destinationChainId,
        destinationCurrency,
        recipient: recipient as Hex,
      }).catch((error) => {
        console.error('Failed to refresh Solana Pay quote', error);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [
    destinationChainId,
    destinationCurrency,
    recipient,
    sourceAccountId,
    sourceAmount,
    sourceAssetId,
    transactionId,
  ]);
}
