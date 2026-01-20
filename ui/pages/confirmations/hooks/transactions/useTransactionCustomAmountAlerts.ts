'use no memo';

import { useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import useAlerts from '../../../../hooks/useAlerts';
import { useConfirmContext } from '../../context/confirm';

export function useTransactionCustomAmountAlerts(): {
  alertMessage?: string;
} {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionId = currentConfirmation?.id ?? '';
  const { alerts: confirmationAlerts } = useAlerts(transactionId);

  const blockingAlerts = useMemo(
    () => confirmationAlerts.filter((a) => a.isBlocking),
    [confirmationAlerts],
  );

  const firstAlert = blockingAlerts?.[0];

  if (!firstAlert) {
    return {};
  }

  const alertMessage =
    (firstAlert.message as string | undefined) ?? firstAlert.reason;

  return {
    alertMessage,
  };
}
