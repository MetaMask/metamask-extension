import React from 'react';
import classnames from 'clsx';
import { TransactionStatus } from '@metamask/transaction-controller';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';

export const STATUS_DISPLAY_MODE = {
  default: 'default',
  activityMinimal: 'activityMinimal',
} as const;

export type StatusDisplayMode =
  (typeof STATUS_DISPLAY_MODE)[keyof typeof STATUS_DISPLAY_MODE];

const QUEUED_PSEUDO_STATUS = 'queued';
const SIGNING_PSUEDO_STATUS = 'signing';

const pendingStatusHash: Partial<
  Record<TransactionStatus, TransactionGroupStatus>
> = {
  [TransactionStatus.submitted]: TransactionGroupStatus.pending,
  [TransactionStatus.approved]: TransactionGroupStatus.pending,
  [TransactionStatus.signed]: TransactionGroupStatus.pending,
};

const statusToClassNameHash: Partial<Record<string, string>> = {
  [TransactionStatus.unapproved]: 'transaction-status-label--unapproved',
  [TransactionStatus.rejected]: 'transaction-status-label--rejected',
  [TransactionStatus.failed]: 'transaction-status-label--failed',
  [TransactionStatus.dropped]: 'transaction-status-label--dropped',
  [TransactionGroupStatus.cancelled]: 'transaction-status-label--cancelled',
  [QUEUED_PSEUDO_STATUS]: 'transaction-status-label--queued',
  [TransactionGroupStatus.pending]: 'transaction-status-label--pending',
};

const getStatusKey = (
  status: string | undefined,
  isEarliestNonce?: boolean,
): string | undefined => {
  if (status === TransactionStatus.approved) {
    return SIGNING_PSUEDO_STATUS;
  }

  if (status && pendingStatusHash[status as TransactionStatus]) {
    return isEarliestNonce
      ? TransactionGroupStatus.pending
      : QUEUED_PSEUDO_STATUS;
  }

  return status;
};

const shouldRenderStatusLabel = (
  statusKey: string | undefined,
  statusDisplayMode: StatusDisplayMode,
): boolean => {
  if (statusDisplayMode !== STATUS_DISPLAY_MODE.activityMinimal) {
    return true;
  }
  return (
    statusKey === QUEUED_PSEUDO_STATUS ||
    statusKey === SIGNING_PSUEDO_STATUS ||
    statusKey === TransactionStatus.failed ||
    statusKey === TransactionStatus.rejected ||
    statusKey === TransactionStatus.dropped ||
    statusKey === TransactionGroupStatus.cancelled
  );
};

export type TransactionStatusLabelProps = {
  status?: string;
  className?: string;
  date?: string;
  error?: { message?: string; rpc?: { message?: string } };
  isEarliestNonce?: boolean;
  statusOnly?: boolean;
  statusDisplayMode?: StatusDisplayMode;
};

// TransactionStatusLabel renders a single line of user-facing status text (i18n from the resolved
// key produced by `getStatusKey`. Statuses are normalized first, e.g. approved reads as
// signing; submitted/signed become pending vs queued based on `isEarliestNonce`).
// When `error` supplies a message, it is shown as a tooltip over the status text.
//
// For confirmed transactions, passing `statusOnly: false` replaces the translated "confirmed"
// copy with `date`, which list UIs use to show when the transaction completed.
//
// `statusDisplayMode: activityMinimal` is currently used on activity list: in this mode
// only queued, signing, and failed states render labels.
export default function TransactionStatusLabel({
  status,
  date,
  error,
  isEarliestNonce,
  className,
  statusOnly,
  statusDisplayMode,
}: Readonly<TransactionStatusLabelProps>) {
  const t = useI18nContext();
  const statusKey = getStatusKey(status, isEarliestNonce);
  const resolvedDisplayMode = statusDisplayMode ?? STATUS_DISPLAY_MODE.default;

  if (!shouldRenderStatusLabel(statusKey, resolvedDisplayMode)) {
    return null;
  }

  const tooltipText = error?.rpc?.message || error?.message;
  let statusText: string | undefined =
    statusKey !== undefined && statusKey !== '' ? t(statusKey) : undefined;

  if (statusKey === TransactionStatus.confirmed && !statusOnly) {
    statusText = date;
  }

  return (
    <Tooltip
      position="top"
      title={tooltipText}
      wrapperClassName={classnames(
        'transaction-status-label',
        `transaction-status-label--${statusKey}`,
        className,
        statusKey ? statusToClassNameHash[statusKey] : undefined,
      )}
    >
      {statusText}
    </Tooltip>
  );
}
