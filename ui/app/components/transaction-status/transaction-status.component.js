import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

const UNAPPROVED_STATUS = 'unapproved'
const REJECTED_STATUS = 'rejected'
const APPROVED_STATUS = 'approved'
const SIGNED_STATUS = 'signed'
const SUBMITTED_STATUS = 'submitted'
const CONFIRMED_STATUS = 'confirmed'
const FAILED_STATUS = 'failed'
const DROPPED_STATUS = 'dropped'

const statusToClassNameHash = {
  [UNAPPROVED_STATUS]: 'transaction-status--unapproved',
  [REJECTED_STATUS]: 'transaction-status--rejected',
  [APPROVED_STATUS]: 'transaction-status--approved',
  [SIGNED_STATUS]: 'transaction-status--signed',
  [SUBMITTED_STATUS]: 'transaction-status--submitted',
  [CONFIRMED_STATUS]: 'transaction-status--confirmed',
  [FAILED_STATUS]: 'transaction-status--failed',
  [DROPPED_STATUS]: 'transaction-status--dropped',
}

const statusToTextHash = {
  [APPROVED_STATUS]: 'pending',
  [SUBMITTED_STATUS]: 'pending',
}

export default class TransactionStatus extends PureComponent {
  static propTypes = {
    status: PropTypes.string,
  }

  render () {
    const { status } = this.props

    return (
      <div className={classnames('transaction-status', statusToClassNameHash[status])}>
        { statusToTextHash[status] || status }
      </div>
    )
  }
}
