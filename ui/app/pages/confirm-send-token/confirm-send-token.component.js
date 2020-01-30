import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base'
import { SEND_ROUTE } from '../../helpers/constants/routes'

export default class ConfirmSendToken extends Component {
  static propTypes = {
    history: PropTypes.object,
    editTransaction: PropTypes.func,
    tokenAmount: PropTypes.number,
  }

  handleEdit (confirmTransactionData) {
    const { editTransaction, history } = this.props
    editTransaction(confirmTransactionData)
    history.push(SEND_ROUTE)
  }

  render () {
    const { tokenAmount } = this.props

    return (
      <ConfirmTokenTransactionBase
        onEdit={confirmTransactionData => this.handleEdit(confirmTransactionData)}
        tokenAmount={tokenAmount}
      />
    )
  }
}
