import React from 'react';
import { Text, TextColor } from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';

const statusConfig: Record<
  string,
  { messageKey: string; color?: TextColor; testId: string }
> = {
  cancelled: {
    messageKey: 'cancelled',
    testId: 'transaction-details-status-cancelled',
  },
  failed: {
    messageKey: 'failed',
    color: TextColor.ErrorDefault,
    testId: 'transaction-details-status-failed',
  },
  confirmed: {
    messageKey: 'confirmed',
    color: TextColor.SuccessDefault,
    testId: 'transaction-details-status-confirmed',
  },
  pending: {
    messageKey: 'pending',
    testId: 'transaction-details-status-pending',
  },
  success: {
    messageKey: 'confirmed',
    color: TextColor.SuccessDefault,
    testId: 'transaction-details-status-success',
  },
};

export function TransactionStatusLabel({ status }: { status: string }) {
  const t = useI18nContext();
  const config = statusConfig[status];

  if (!config) {
    return null;
  }

  return (
    <Text color={config.color} data-testid={config.testId}>
      {t(config.messageKey)}
    </Text>
  );
}
