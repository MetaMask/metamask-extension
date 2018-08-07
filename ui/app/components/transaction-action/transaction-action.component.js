import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { getTransactionActionKey } from '../../helpers/transactions.util'

export default class TransactionAction extends PureComponent {
  static contextTypes = {
    tOrDefault: PropTypes.func,
  }

  static propTypes = {
    className: PropTypes.string,
    transaction: PropTypes.object,
    methodData: PropTypes.object,
  }

  state = {
    transactionAction: '',
  }

  componentDidMount () {
    this.getTransactionAction()
  }

  componentDidUpdate () {
    this.getTransactionAction()
  }

  getTransactionAction () {
    const { transactionAction } = this.state
    const { transaction, methodData } = this.props
    const { data, done } = methodData

    if (!done || transactionAction) {
      return
    }

    const actionKey = getTransactionActionKey(transaction, data)
    const action = actionKey && this.context.tOrDefault(actionKey)
    this.setState({ transactionAction: action })
  }

  render () {
    const { className, methodData: { isFetching } } = this.props
    const { transactionAction } = this.state

    return (
      <div className={className}>
        { (!isFetching && transactionAction) || '--' }
      </div>
    )
  }
}
