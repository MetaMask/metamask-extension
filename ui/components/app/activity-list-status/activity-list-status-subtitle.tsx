import React from 'react';
import {
  getTransactionDisplayStatusKey,
  shouldShowActivityListStatusSubtitle,
} from '../../../../shared/lib/activity/transaction-display-status';
import TransactionStatusLabel, {
  STATUS_DISPLAY_MODE,
} from '../transaction-status-label';

export type ActivityListStatusSubtitleProps = {
  status?: string;
  isEarliestNonce?: boolean;
  date?: string;
  error?: { message?: string; rpc?: { message?: string } };
  className?: string;
};

/**
 * Activity list second line for legacy EVM / multichain rows.
 * Returns null when the resolved status should not show subtitle text.
 */
export function ActivityListStatusSubtitle({
  status,
  isEarliestNonce,
  date,
  error,
  className,
}: Readonly<ActivityListStatusSubtitleProps>) {
  const statusKey = getTransactionDisplayStatusKey(status, isEarliestNonce);

  if (!shouldShowActivityListStatusSubtitle(statusKey)) {
    return null;
  }

  return (
    <TransactionStatusLabel
      status={status}
      isEarliestNonce={isEarliestNonce}
      date={date}
      error={error}
      className={className}
      statusOnly
      statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
    />
  );
}
