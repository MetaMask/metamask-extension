import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import { getTransactionActionKey } from '../../../helpers/utils/transactions.util'
import { camelCaseToCapitalize } from '../../../helpers/utils/common.util'

export default class TransactionAction extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    className: PropTypes.string,
    transaction: PropTypes.object,
    methodData: PropTypes.object,
  }

  getTransactionAction () {
    const { transaction, methodData } = this.props
    const { name } = methodData

    const actionKey = getTransactionActionKey(transaction)
    const action = actionKey && this.context.t(actionKey)
    const methodName = name && camelCaseToCapitalize(name)

    return methodName || action || ''
  }

  render () {
    const { className } = this.props

    return (
      <div className={classnames('transaction-action', className)}>
        { this.getTransactionAction() }
      </div>
    )
  }
}
