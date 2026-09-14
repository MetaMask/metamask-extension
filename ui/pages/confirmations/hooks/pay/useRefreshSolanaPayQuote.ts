import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPayRequiredToken } from '@metamask/transaction-pay-controller';
import {
  selectSolanaPayQuoteByTransactionId,
  selectTransactionPayIntentByTransactionId,
  type TransactionPayState,
} from '../../../../selectors/transactionPayController';
import { refreshSolanaPayQuote } from '../../../../store/controller-actions/transaction-pay-controller';
import { useConfirmContext } from '../../context/confirm';

/**
 * Refreshes Core's Solana route when the destination amount changes. Core
 * owns exact-input versus exact-output selection and derives destination
 * product calls from the current transaction.
 *
 * @param requiredToken - Current destination token and amount.
 */
export function useRefreshSolanaPayQuote(
  requiredToken: TransactionPayRequiredToken | undefined,
): void {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const payIntent = useSelector((state: TransactionPayState) =>
    selectTransactionPayIntentByTransactionId(state, transactionId),
  );
  const quote = useSelector((state: TransactionPayState) =>
    selectSolanaPayQuoteByTransactionId(state, transactionId),
  );
  const targetAmountRaw = requiredToken?.amountRaw;
  const quotedTargetAmountRaw = quote?.route.targetAmountMinimum;
  const isSolanaSource = payIntent?.sourceChainId.startsWith('solana:');

  useEffect(() => {
    if (
      !transactionId ||
      !isSolanaSource ||
      !targetAmountRaw ||
      quotedTargetAmountRaw === targetAmountRaw
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      refreshSolanaPayQuote(transactionId).catch((error) => {
        console.error('Failed to refresh Solana Pay quote', error);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [isSolanaSource, quotedTargetAmountRaw, targetAmountRaw, transactionId]);
}
