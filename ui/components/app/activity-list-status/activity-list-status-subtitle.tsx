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
  error?: { message?: string; rpc?: { message?: string } };
  className?: string;
  label?: string;
  tooltip?: string;
};

/**
 * Activity list second line for legacy EVM / multichain rows.
 * Returns null when the resolved status should not show subtitle text.
 *
 * @param options0 - Component props.
 * @param options0.status - Raw transaction status.
 * @param options0.isEarliestNonce - Whether this tx has the earliest nonce on its chain.
 * @param options0.error - Optional error for status tooltip text.
 * @param options0.className - Optional class name for the status label.
 * @param options0.label - Optional label text to display instead of the status.
 * @param options0.tooltip - Optional tooltip text to display when the status is hovered.
 */
export function ActivityListStatusSubtitle({
  status,
  isEarliestNonce,
  error,
  className,
  label,
  tooltip,
}: Readonly<ActivityListStatusSubtitleProps>) {
  const statusKey = getTransactionDisplayStatusKey(status, isEarliestNonce);

  if (!shouldShowActivityListStatusSubtitle(statusKey)) {
    return null;
  }

  return (
    <TransactionStatusLabel
      status={status}
      isEarliestNonce={isEarliestNonce}
      error={error}
      className={className}
      statusDisplayMode={STATUS_DISPLAY_MODE.activityMinimal}
      label={label}
      tooltip={tooltip}
    />
  );
}
