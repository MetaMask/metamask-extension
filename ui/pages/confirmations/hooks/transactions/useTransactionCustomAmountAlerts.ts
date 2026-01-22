'use no memo';

import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import useAlerts from '../../../../hooks/useAlerts';
import { useConfirmContext } from '../../context/confirm';
import { AlertsName } from '../alerts/constants';

const ALERTS_HIDE_RESULTS: string[] = [
  AlertsName.InsufficientPayTokenBalance,
  AlertsName.SigningOrSubmitting,
];

export function useTransactionCustomAmountAlerts(): {
  alertMessage?: string;
  hideResults: boolean;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { alerts: confirmationAlerts } = useAlerts(transactionId);

  const blockingAlerts = useMemo(
    () => confirmationAlerts.filter((a) => a.isBlocking),
    [confirmationAlerts],
  );

  const hideResults = useMemo(
    () => blockingAlerts.some((a) => ALERTS_HIDE_RESULTS.includes(a.key)),
    [blockingAlerts],
  );

  const firstAlert = blockingAlerts?.[0];

  if (!firstAlert) {
    return {
      hideResults,
    };
  }

  const alertMessage =
    (firstAlert.message as string | undefined) ?? firstAlert.reason;

  return {
    alertMessage,
    hideResults,
  };
}
