import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TransactionPayControllerState } from '@metamask/transaction-pay-controller';
import {
  selectIsTransactionPayLoadingByTransactionId,
  selectTransactionPayIsMaxAmountByTransactionId,
  selectTransactionPayQuotesByTransactionId,
  selectTransactionPaySourceAmountsByTransactionId,
  selectTransactionPayTokensByTransactionId,
  selectTransactionPayTotalsByTransactionId,
} from '../../../../selectors/transactionPayController';
import { useConfirmContext } from '../../context/confirm';

type TransactionPayState = {
  metamask: {
    TransactionPayController?: TransactionPayControllerState;
  };
};

export function useTransactionPayQuotes() {
  return useTransactionPayData(selectTransactionPayQuotesByTransactionId);
}

export function useTransactionPayRequiredTokens() {
  return useTransactionPayData(selectTransactionPayTokensByTransactionId);
}

export function useTransactionPaySourceAmounts() {
  return useTransactionPayData(
    selectTransactionPaySourceAmountsByTransactionId,
  );
}

export function useIsTransactionPayLoading() {
  return useTransactionPayData(selectIsTransactionPayLoadingByTransactionId);
}

export function useTransactionPayTotals() {
  return useTransactionPayData(selectTransactionPayTotalsByTransactionId);
}

export function useTransactionPayIsMaxAmount() {
  return useTransactionPayData(selectTransactionPayIsMaxAmountByTransactionId);
}

function useTransactionPayData<T>(
  selector: (state: TransactionPayState, transactionId: string) => T,
) {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';

  return useSelector((state: TransactionPayState) =>
    selector(state, transactionId),
  );
}

