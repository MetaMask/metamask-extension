import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import useAlerts from '../../../../hooks/useAlerts';
import { useConfirmContext } from '../../context/confirm';
import { usePendingAmountAlerts } from '../alerts/usePendingAmountAlerts';
import { AlertsName } from '../alerts/constants';

const ALERTS_HIDE_RESULTS: string[] = [
  AlertsName.AccountNoFunds,
  AlertsName.DepositLimit,
  AlertsName.InsufficientPayTokenBalance,
  AlertsName.InsufficientMoneyAccountBalance,
  AlertsName.PayHardwareAccount,
  AlertsName.PerpsWithdrawBalanceUnavailable,
  AlertsName.SigningOrSubmitting,
];

const ALERTS_DISABLE_UPDATE: string[] = [
  AlertsName.AccountNoFunds,
  AlertsName.PayHardwareAccount,
  AlertsName.SigningOrSubmitting,
];

/** Amount-field alerts that should surface their message even when it matches reason. */
const ALERTS_SHOW_INLINE_MESSAGE: string[] = [
  AlertsName.InsufficientPayTokenBalance,
  AlertsName.InsufficientMoneyAccountBalance,
  AlertsName.DepositLimit,
];

export function useTransactionCustomAmountAlerts({
  pendingFiatAmount,
}: {
  pendingFiatAmount?: string;
} = {}): {
  alertMessage?: string;
  hasAlert: boolean;
  hideResults: boolean;
  disableUpdate: boolean;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { alerts: confirmationAlerts } = useAlerts(transactionId);
  const pendingAmountAlerts = usePendingAmountAlerts({
    pendingFiatAmount,
  });

  const blockingAlerts = useMemo(() => {
    const confirmationBlocking = confirmationAlerts.filter((a) => a.isBlocking);
    // Prefer live typed-amount alerts so Money → Perps shows insufficient
    // funds before the debounced quote refreshes required tokens.
    return [...pendingAmountAlerts, ...confirmationBlocking];
  }, [confirmationAlerts, pendingAmountAlerts]);

  const hideResults = useMemo(
    () => blockingAlerts.some((a) => ALERTS_HIDE_RESULTS.includes(a.key)),
    [blockingAlerts],
  );

  const disableUpdate = useMemo(
    () => blockingAlerts.some((a) => ALERTS_DISABLE_UPDATE.includes(a.key)),
    [blockingAlerts],
  );

  const firstAlert = blockingAlerts?.[0];

  if (!firstAlert) {
    return {
      disableUpdate,
      hasAlert: false,
      hideResults,
    };
  }

  const { reason, message, key } = firstAlert;
  const showInlineEvenIfSame = ALERTS_SHOW_INLINE_MESSAGE.includes(key);
  const alertMessage =
    reason && message && (reason !== message || showInlineEvenIfSame)
      ? (message as string)
      : undefined;

  return {
    ...(alertMessage ? { alertMessage } : {}),
    disableUpdate,
    hasAlert: true,
    hideResults,
  };
}
