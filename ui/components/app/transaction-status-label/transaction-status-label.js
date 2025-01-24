import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
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
 *
 * Confirmed transactions are not especially highlighted except that their
 * status label will be the date the transaction was finalized.
 */
const pendingStatusHash = {
  [TransactionStatus.submitted]: TransactionGroupStatus.pending,
  [TransactionStatus.approved]: TransactionGroupStatus.pending,
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
  date,
  error,
  isEarliestNonce,
  className,
  statusOnly,
  shouldShowTooltip,
}) {
  const t = useI18nContext();
  const statusKey = getStatusKey(status, isEarliestNonce);
  const tooltipText = error?.rpc?.message || error?.message;
  let statusText = statusKey && t(statusKey);

  if (statusKey === TransactionStatus.confirmed && !statusOnly) {
    statusText = date;
  }

  return shouldShowTooltip ? (
    <Tooltip
      position="top"
      title={tooltipText}
      wrapperClassName={classnames(
        'transaction-status-label',
        `transaction-status-label--${statusKey}`,
        className,
        statusToClassNameHash[statusKey],
      )}
    >
      {statusText}
    </Tooltip>
  ) : (
    <div
      data-testid="transaction-status-label"
      className={classnames(
        'transaction-status-label',
        className,
        statusToClassNameHash[statusKey],
      )}
    >
      {statusText}
    </div>
  );
}

TransactionStatusLabel.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
  date: PropTypes.string,
  error: PropTypes.object,
  isEarliestNonce: PropTypes.bool,
  statusOnly: PropTypes.bool,
  shouldShowTooltip: PropTypes.bool,
};

TransactionStatusLabel.defaultProps = {
  shouldShowTooltip: true,
};
