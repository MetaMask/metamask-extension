import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTransactionBase from '../confirm-transaction-base'
import { SEND_ROUTE } from '../../../routes'

export default class ConfirmSendToken extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    history: PropTypes.object,
    tokenAddress: PropTypes.string,
    toAddress: PropTypes.string,
    numberOfTokens: PropTypes.number,
    tokenSymbol: PropTypes.string,
    editTransaction: PropTypes.func,
  }

  handleEdit (confirmTransactionData) {
    const { editTransaction, history } = this.props
    editTransaction(confirmTransactionData)
    history.push(SEND_ROUTE)
  }

  render () {
    const { toAddress, tokenAddress, tokenSymbol, numberOfTokens } = this.props

    return (
      <ConfirmTransactionBase
        toAddress={toAddress}
        identiconAddress={tokenAddress}
        title={`${numberOfTokens} ${tokenSymbol}`}
        onEdit={confirmTransactionData => this.handleEdit(confirmTransactionData)}
        hideSubtitle
      />
    )
  }
}
