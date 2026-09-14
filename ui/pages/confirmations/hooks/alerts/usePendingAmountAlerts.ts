import { useMemo } from 'react';
import type { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useInsufficientMoneyAccountBalanceAlert } from './transactions/useInsufficientMoneyAccountBalanceAlert';
import { useInsufficientPayTokenBalanceAlert } from './transactions/useInsufficientPayTokenBalanceAlert';
import { useTransactionDepositLimitAlert } from './transactions/useTransactionDepositLimitAlert';

/**
 * Amount-entry alerts evaluated against the in-progress fiat value (before the
 * debounced quote refresh). Mirrors mobile `usePendingAmountAlerts` so Money →
 * Perps and other Pay amount screens block when the typed amount exceeds the
 * available Money Account / pay-token balance.
 *
 * @param options
 * @param options.pendingFiatAmount - Current amount-field fiat string.
 */
export function usePendingAmountAlerts({
  pendingFiatAmount,
}: {
  pendingFiatAmount?: string;
} = {}): Alert[] {
  const insufficientTokenFundsAlert = useInsufficientPayTokenBalanceAlert({
    pendingAmountUsd: pendingFiatAmount ?? '0',
  });

  const insufficientMoneyAccountBalanceAlert =
    useInsufficientMoneyAccountBalanceAlert({
      pendingAmount: pendingFiatAmount,
    });

  const depositLimitAlert = useTransactionDepositLimitAlert({
    pendingAmount: pendingFiatAmount,
  });

  return useMemo(
    () => [
      ...insufficientTokenFundsAlert,
      ...insufficientMoneyAccountBalanceAlert,
      ...depositLimitAlert,
    ],
    [
      depositLimitAlert,
      insufficientMoneyAccountBalanceAlert,
      insufficientTokenFundsAlert,
    ],
  );
}
