import React, { useId } from 'react';
import { useLocalTransactionMeta } from '../../../hooks/activity/useLocalTransactionMeta';
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

export function TransactionStatus({
  status,
  hash,
}: {
  status: string;
  hash?: string;
}) {
  const t = useI18nContext();
  const id = useId();
  const config = statusConfig[status];
  const localError = useLocalTransactionMeta(hash)?.error;
  const error =
    status === 'failed'
      ? localError?.rpc?.message || localError?.message
      : undefined;

  if (!config) {
    return null;
  }

  const label = (
    <span className={config.className} data-testid={config.testId}>
      {t(config.messageKey)}
    </span>
  );

  if (!error) {
    return label;
  }

  return (
    <>
      <button
        type="button"
        className="border-0 bg-transparent p-0"
        // @ts-expect-error We need to update React types
        interestfor={id} // eslint-disable-line react/no-unknown-property
      >
        {label}
      </button>
      <div
        id={id}
        data-testid="transaction-status-error-tooltip"
        className="m-0 max-w-[250px] rounded-lg border border-border-muted bg-background-default p-4 text-start text-text-default shadow-md [position-area:bottom]"
        // @ts-expect-error We need to update React types
        popover="hint"
      >
        {error}
      </div>
    </>
  );
}
