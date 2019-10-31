import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { calcTransactionTimeRemaining } from './transaction-time-remaining.util'

export default class TransactionTimeRemaining extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    initialTimeEstimate: PropTypes.number,
    submittedTime: PropTypes.number,
  }

  constructor (props) {
    super(props)
    const { initialTimeEstimate, submittedTime } = props
    this.state = {
      timeRemaining: calcTransactionTimeRemaining(initialTimeEstimate, submittedTime),
    }
    this.interval = setInterval(
      () => this.setState({ timeRemaining: calcTransactionTimeRemaining(initialTimeEstimate, submittedTime) }),
      1000
    )
  }

  componentDidUpdate (prevProps) {
    const { initialTimeEstimate, submittedTime } = this.props
    if (initialTimeEstimate !== prevProps.initialTimeEstimate) {
      clearInterval(this.interval)
      const calcedTimeRemaining = calcTransactionTimeRemaining(initialTimeEstimate, submittedTime)
      this.setState({ timeRemaining: calcedTimeRemaining })
      this.interval = setInterval(
        () => this.setState({ timeRemaining: calcTransactionTimeRemaining(initialTimeEstimate, submittedTime) }),
        1000
      )
    }
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  render () {
    const { className } = this.props
    const { timeRemaining } = this.state

    return (
      <div className={className}>
        { timeRemaining }
      </div>

    )
  }
}
