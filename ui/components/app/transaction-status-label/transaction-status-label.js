import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'clsx';
import { TransactionStatus } from '@metamask/transaction-controller';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';

const QUEUED_PSEUDO_STATUS = 'queued';
const SIGNING_PSUEDO_STATUS = 'signing';

/**
 * A note about status logic for this component:
 * Approved, Signed and Submitted statuses are all treated, effectively
 * as pending. Transactions are only approved or signed for less than a
 * second, usually, and ultimately should be rendered in the UI no
 * differently than a pending transaction.
 */
const pendingStatusHash = {
  [TransactionStatus.submitted]: TransactionGroupStatus.pending,
  [TransactionStatus.approved]: TransactionGroupStatus.pending,
  [TransactionStatus.signed]: TransactionGroupStatus.pending,
};

const statusToClassNameHash = {
  [TransactionStatus.unapproved]: 'transaction-status-label--unapproved',
  [TransactionStatus.rejected]: 'transaction-status-label--rejected',
  [TransactionStatus.failed]: 'transaction-status-label--failed',
  [TransactionStatus.dropped]: 'transaction-status-label--dropped',
  [TransactionGroupStatus.cancelled]: 'transaction-status-label--cancelled',
  [QUEUED_PSEUDO_STATUS]: 'transaction-status-label--queued',
  [TransactionGroupStatus.pending]: 'transaction-status-label--pending',
};

function getStatusKey(status, isEarliestNonce) {
  if (status === TransactionStatus.approved) {
    return SIGNING_PSUEDO_STATUS;
  }

  if (pendingStatusHash[status]) {
    return isEarliestNonce
      ? TransactionGroupStatus.pending
      : QUEUED_PSEUDO_STATUS;
  }

  return status;
}

export default function TransactionStatusLabel({
  status,
  error,
  isEarliestNonce,
  className,
  label,
  tooltip,
}) {
  const t = useI18nContext();
  const statusKey = getStatusKey(status, isEarliestNonce);
  const tooltipText = tooltip || error?.rpc?.message || error?.message;
  const statusText = label ?? (statusKey && t(statusKey));

  return (
    <Tooltip
      position="top"
      title={tooltipText}
      wrapperClassName={classnames(
        'transaction-status-label',
        label ? 'transaction-status-label--confirmed' : undefined,
        !label && `transaction-status-label--${statusKey}`,
        className,
        !label && statusToClassNameHash[statusKey],
      )}
    >
      {statusText}
    </Tooltip>
  );
}

TransactionStatusLabel.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
  error: PropTypes.object,
  isEarliestNonce: PropTypes.bool,
  label: PropTypes.string,
  tooltip: PropTypes.string,
};
