import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import {
  TRANSACTION_CREATED_EVENT,
  TRANSACTION_SUBMITTED_EVENT,
  TRANSACTION_RESUBMITTED_EVENT,
  TRANSACTION_CONFIRMED_EVENT,
  TRANSACTION_DROPPED_EVENT,
  TRANSACTION_ERRORED_EVENT,
  TRANSACTION_CANCEL_ATTEMPTED_EVENT,
  TRANSACTION_CANCEL_SUCCESS_EVENT,
} from '../transaction-activity-log.constants'

const imageHash = {
  [TRANSACTION_CREATED_EVENT]: '/images/icons/new.svg',
  [TRANSACTION_SUBMITTED_EVENT]: '/images/icons/submitted.svg',
  [TRANSACTION_RESUBMITTED_EVENT]: '/images/icons/retry.svg',
  [TRANSACTION_CONFIRMED_EVENT]: '/images/icons/confirm.svg',
  [TRANSACTION_DROPPED_EVENT]: '/images/icons/cancelled.svg',
  [TRANSACTION_ERRORED_EVENT]: '/images/icons/error.svg',
  [TRANSACTION_CANCEL_ATTEMPTED_EVENT]: '/images/icons/cancelled.svg',
  [TRANSACTION_CANCEL_SUCCESS_EVENT]: '/images/icons/cancelled.svg',
}

export default class TransactionActivityLogIcon extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    className: PropTypes.string,
    eventKey: PropTypes.oneOf(Object.keys(imageHash)),
  }

  render() {
    const { className, eventKey } = this.props
    const imagePath = imageHash[eventKey]

    return (
      <div className={classnames('transaction-activity-log-icon', className)}>
        {imagePath && <img src={imagePath} height={9} width={9} />}
      </div>
    )
  }
}
