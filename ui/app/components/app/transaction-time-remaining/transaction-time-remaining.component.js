import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import {
  SUBMITTED_STATUS,
} from '../../../helpers/constants/transactions'

const statusToTextHash = {
  [SUBMITTED_STATUS]: 'pending',
}

export default class TransactionTimeRemaining extends PureComponent {
  static propTypes = {
    statusKey: PropTypes.string,
    className: PropTypes.string,
    currentTimeEstimate: PropTypes.string,
  }

  render () {
    const { className, statusKey } = this.props

    return (
      <div className={className}>
        {statusToTextHash[statusKey] === 'pending' ? this.props.currentTimeEstimate : null}
      </div>

    )
  }
}
