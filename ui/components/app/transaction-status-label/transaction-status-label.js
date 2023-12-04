import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { TransactionStatus } from '@metamask/transaction-controller';
import Tooltip from '../../ui/tooltip';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { TransactionGroupStatus } from '../../../../shared/constants/transaction';

const QUEUED_PSEUDO_STATUS = 'queued';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
const CUSTODIAN_PSEUDO_STATUS = 'inCustody';
///: END:ONLY_INCLUDE_IF

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
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  [CUSTODIAN_PSEUDO_STATUS]: 'transaction-status--custodian',
  ///: END:ONLY_INCLUDE_IF
};

export default function TransactionStatusLabel({
  status,
  date,
  error,
  isEarliestNonce,
  className,
  statusOnly,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  custodyStatus,
  custodyStatusDisplayText,
  ///: END:ONLY_INCLUDE_IF
}) {
  const t = useI18nContext();
  let tooltipText = error?.rpc?.message || error?.message;
  let statusKey = status;
  if (pendingStatusHash[status]) {
    statusKey = isEarliestNonce
      ? TransactionGroupStatus.pending
      : QUEUED_PSEUDO_STATUS;
  }

  let statusText = statusKey && t(statusKey);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  statusText = custodyStatusDisplayText || t(statusKey);
  ///: END:ONLY_INCLUDE_IF

  if (statusKey === TransactionStatus.confirmed && !statusOnly) {
    statusText = date;
  }

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  if (custodyStatus) {
    if (error) {
      tooltipText = error.message;
      statusText =
        custodyStatus === 'aborted'
          ? custodyStatusDisplayText
          : t('snapResultError');
    } else {
      tooltipText = custodyStatusDisplayText || custodyStatus;
      statusText = custodyStatusDisplayText || custodyStatus;
    }
  }
  ///: END:ONLY_INCLUDE_IF

  return (
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
  );
}

TransactionStatusLabel.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
  date: PropTypes.string,
  error: PropTypes.object,
  isEarliestNonce: PropTypes.bool,
  statusOnly: PropTypes.bool,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  custodyStatus: PropTypes.string,
  custodyStatusDisplayText: PropTypes.string,
  ///: END:ONLY_INCLUDE_IF
};
