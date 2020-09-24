import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Tooltip from '../../ui/tooltip'

import { useI18nContext } from '../../../hooks/useI18nContext'
import {
  TRANSACTION_GROUP_STATUS_CANCELLED,
  TRANSACTION_STATUS_APPROVED,
  TRANSACTION_STATUS_CONFIRMED,
  TRANSACTION_STATUS_DROPPED,
  TRANSACTION_STATUS_FAILED,
  TRANSACTION_STATUS_REJECTED,
  TRANSACTION_STATUS_SIGNED,
  TRANSACTION_STATUS_SUBMITTED,
  TRANSACTION_STATUS_UNAPPROVED,
} from '../../../../../shared/constants/transaction'

const QUEUED_PSEUDO_STATUS = 'queued'
const PENDING_PSEUDO_STATUS = 'pending'

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
  [TRANSACTION_STATUS_SUBMITTED]: PENDING_PSEUDO_STATUS,
  [TRANSACTION_STATUS_APPROVED]: PENDING_PSEUDO_STATUS,
  [TRANSACTION_STATUS_SIGNED]: PENDING_PSEUDO_STATUS,
}

const statusToClassNameHash = {
  [TRANSACTION_STATUS_UNAPPROVED]: 'transaction-status--unapproved',
  [TRANSACTION_STATUS_REJECTED]: 'transaction-status--rejected',
  [TRANSACTION_STATUS_FAILED]: 'transaction-status--failed',
  [TRANSACTION_STATUS_DROPPED]: 'transaction-status--dropped',
  [TRANSACTION_GROUP_STATUS_CANCELLED]: 'transaction-status--cancelled',
  [QUEUED_PSEUDO_STATUS]: 'transaction-status--queued',
  [PENDING_PSEUDO_STATUS]: 'transaction-status--pending',
}

export default function TransactionStatus ({ status, date, error, isEarliestNonce, className }) {
  const t = useI18nContext()
  const tooltipText = error?.rpc?.message || error?.message
  let statusKey = status
  if (pendingStatusHash[status]) {
    statusKey = isEarliestNonce ? PENDING_PSEUDO_STATUS : QUEUED_PSEUDO_STATUS
  }

  const statusText = statusKey === TRANSACTION_STATUS_CONFIRMED ? date : t(statusKey)

  return (
    <Tooltip
      position="top"
      title={tooltipText}
      wrapperClassName={classnames('transaction-status', className, statusToClassNameHash[statusKey])}
    >
      { statusText }
    </Tooltip>
  )
}

TransactionStatus.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
  date: PropTypes.string,
  error: PropTypes.object,
  isEarliestNonce: PropTypes.bool,
}
