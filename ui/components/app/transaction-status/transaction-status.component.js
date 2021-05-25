import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Tooltip from '../../ui/tooltip';

import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TRANSACTION_GROUP_STATUSES,
  TRANSACTION_STATUSES,
} from '../../../../shared/constants/transaction';

const QUEUED_PSEUDO_STATUS = 'queued';

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
  [TRANSACTION_STATUSES.SUBMITTED]: TRANSACTION_GROUP_STATUSES.PENDING,
  [TRANSACTION_STATUSES.APPROVED]: TRANSACTION_GROUP_STATUSES.PENDING,
  [TRANSACTION_STATUSES.SIGNED]: TRANSACTION_GROUP_STATUSES.PENDING,
};

const statusToClassNameHash = {
  [TRANSACTION_STATUSES.UNAPPROVED]: 'transaction-status--unapproved',
  [TRANSACTION_STATUSES.REJECTED]: 'transaction-status--rejected',
  [TRANSACTION_STATUSES.FAILED]: 'transaction-status--failed',
  [TRANSACTION_STATUSES.DROPPED]: 'transaction-status--dropped',
  [TRANSACTION_GROUP_STATUSES.CANCELLED]: 'transaction-status--cancelled',
  [QUEUED_PSEUDO_STATUS]: 'transaction-status--queued',
  [TRANSACTION_GROUP_STATUSES.PENDING]: 'transaction-status--pending',
};

export default function TransactionStatus({
  status,
  date,
  error,
  isEarliestNonce,
  className,
}) {
  const t = useI18nContext();
  const tooltipText = error?.rpc?.message || error?.message;
  let statusKey = status;
  if (pendingStatusHash[status]) {
    statusKey = isEarliestNonce
      ? TRANSACTION_GROUP_STATUSES.PENDING
      : QUEUED_PSEUDO_STATUS;
  }

  const statusText =
    statusKey === TRANSACTION_STATUSES.CONFIRMED ? date : t(statusKey);

  return (
    <Tooltip
      position="top"
      title={tooltipText}
      wrapperClassName={classnames(
        'transaction-status',
        className,
        statusToClassNameHash[statusKey],
      )}
    >
      {statusText}
    </Tooltip>
  );
}

TransactionStatus.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
  date: PropTypes.string,
  error: PropTypes.object,
  isEarliestNonce: PropTypes.bool,
};
