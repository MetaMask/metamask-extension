import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import {
  SUBMITTED_STATUS,
} from '../../../helpers/constants/transactions'

const statusToTextHash = {
  [SUBMITTED_STATUS]: 'pending',
}

export default class TransactionTimeRemaining extends PureComponent {
  static defaultProps = {
    title: null,
  }

  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    statusKey: PropTypes.string,
    className: PropTypes.string,
    title: PropTypes.string,
    currentTimeEstimate: PropTypes.string,
    fetchBasicGasAndTimeEstimates: PropTypes.func,
    fetchGasEstimates: PropTypes.func,
    blockTime: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  }

  render () {
    const { className, statusKey } = this.props

    if (statusToTextHash[statusKey] === 'pending') {
      const promise = this.props.fetchBasicGasAndTimeEstimates()
        .then(basicEstimates => basicEstimates.blockTime)

      promise
        .then(blockTime => {
          this.props.fetchGasEstimates(blockTime)
        })
    }

    return (
      <div className={className}>
       
      </div>

    )
  }
}
