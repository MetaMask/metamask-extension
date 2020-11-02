import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Tooltip from '../../ui/tooltip'

import {
  UNAPPROVED_STATUS,
  REJECTED_STATUS,
  SUBMITTED_STATUS,
  CONFIRMED_STATUS,
  FAILED_STATUS,
  DROPPED_STATUS,
  CANCELLED_STATUS,
  APPROVED_STATUS,
  SIGNED_STATUS,
} from '../../../helpers/constants/transactions'
import { useI18nContext } from '../../../hooks/useI18nContext'

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
  [SUBMITTED_STATUS]: PENDING_PSEUDO_STATUS,
  [APPROVED_STATUS]: PENDING_PSEUDO_STATUS,
  [SIGNED_STATUS]: PENDING_PSEUDO_STATUS,
}

const statusToClassNameHash = {
  [UNAPPROVED_STATUS]: 'transaction-status--unapproved',
  [REJECTED_STATUS]: 'transaction-status--rejected',
  [FAILED_STATUS]: 'transaction-status--failed',
  [DROPPED_STATUS]: 'transaction-status--dropped',
  [CANCELLED_STATUS]: 'transaction-status--cancelled',
  [QUEUED_PSEUDO_STATUS]: 'transaction-status--queued',
  [PENDING_PSEUDO_STATUS]: 'transaction-status--pending',
}

export default function TransactionStatus({
  status,
  date,
  error,
  isEarliestNonce,
  className,
}) {
  const t = useI18nContext()
  const tooltipText = error?.rpc?.message || error?.message
  let statusKey = status
  if (pendingStatusHash[status]) {
    statusKey = isEarliestNonce ? PENDING_PSEUDO_STATUS : QUEUED_PSEUDO_STATUS
  }

  const statusText = statusKey === CONFIRMED_STATUS ? date : t(statusKey)

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
  )
}

TransactionStatus.propTypes = {
  status: PropTypes.string,
  className: PropTypes.string,
  date: PropTypes.string,
  error: PropTypes.object,
  isEarliestNonce: PropTypes.bool,
}
