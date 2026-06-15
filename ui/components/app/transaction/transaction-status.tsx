import React from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const statusConfig: Record<
  string,
  { messageKey: string; className?: string; testId: string }
> = {
  cancelled: {
    messageKey: 'cancelled',
    testId: 'transaction-details-status-cancelled',
  },
  failed: {
    messageKey: 'failed',
    className: 'text-error-default',
    testId: 'transaction-details-status-failed',
  },
  confirmed: {
    messageKey: 'confirmed',
    className: 'text-success-default',
    testId: 'transaction-details-status-confirmed',
  },
  pending: {
    messageKey: 'pending',
    testId: 'transaction-details-status-pending',
  },
  success: {
    messageKey: 'confirmed',
    className: 'text-success-default',
    testId: 'transaction-details-status-success',
  },
};

export function TransactionStatus({ status }: { status: string }) {
  const t = useI18nContext();
  const config = statusConfig[status];

  if (!config) {
    return null;
  }

  return (
    <span className={config.className} data-testid={config.testId}>
      {t(config.messageKey)}
    </span>
  );
}
