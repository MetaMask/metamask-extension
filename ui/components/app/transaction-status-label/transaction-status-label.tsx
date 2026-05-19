import React from 'react';
import classnames from 'clsx';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getTransactionDisplayStatusKey,
  shouldShowActivityListStatusSubtitle,
} from '../../../../shared/lib/activity/transaction-display-status';

export const STATUS_DISPLAY_MODE = {
  default: 'default',
  activityMinimal: 'activityMinimal',
} as const;

export type StatusDisplayMode =
  (typeof STATUS_DISPLAY_MODE)[keyof typeof STATUS_DISPLAY_MODE];

const shouldRenderStatusText = (
  statusKey: string | undefined,
  statusDisplayMode: StatusDisplayMode,
): boolean => {
  if (statusDisplayMode !== STATUS_DISPLAY_MODE.activityMinimal) {
    return true;
  }
  return shouldShowActivityListStatusSubtitle(statusKey);
};

export type TransactionStatusLabelProps = {
  status?: string;
  className?: string;
  error?: { message?: string; rpc?: { message?: string } };
  isEarliestNonce?: boolean;
  statusDisplayMode?: StatusDisplayMode;
  label?: string;
  tooltip?: string;
};

// TransactionStatusLabel renders a single line of user-facing status text (i18n from the resolved
// key produced by `getTransactionDisplayStatusKey`. Statuses are normalized first, e.g. approved reads as
// signing; submitted/signed become pending vs queued based on `isEarliestNonce`).
// When `error` supplies a message, it is shown as a tooltip over the status text.
//
// `statusDisplayMode: activityMinimal` is used on activity list rows: only queued, signing, and
// failed states render label text.
export default function TransactionStatusLabel({
  status,
  error,
  isEarliestNonce,
  className,
  statusDisplayMode = STATUS_DISPLAY_MODE.default,
  label,
  tooltip,
}: Readonly<TransactionStatusLabelProps>) {
  const t = useI18nContext();
  const statusKey = getTransactionDisplayStatusKey(status, isEarliestNonce);
  if (!label) {
    if (statusKey === undefined || statusKey === '') {
      return null;
    }
    if (!shouldRenderStatusText(statusKey, statusDisplayMode)) {
      return null;
    }
  }

  const tooltipText = tooltip || error?.rpc?.message || error?.message;
  const statusText = label ?? t(statusKey);

  return (
    <Tooltip
      position="top"
      title={tooltipText}
      wrapperClassName={classnames(
        'transaction-status-label',
        label ? 'transaction-status-label--confirmed' : undefined,
        !label && `transaction-status-label--${statusKey}`,
        className,
      )}
    >
      {statusText}
    </Tooltip>
  );
}
