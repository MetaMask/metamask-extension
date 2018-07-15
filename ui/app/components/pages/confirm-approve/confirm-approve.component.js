import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base'

export default class ConfirmApprove extends Component {
  static propTypes = {
    tokenAmount: PropTypes.number,
    tokenSymbol: PropTypes.string,
  }

  render () {
    const { tokenAmount, tokenSymbol } = this.props

    return (
      <ConfirmTokenTransactionBase
        tokenAmount={tokenAmount}
        warning={`By approving this action, you grant permission for this contract to spend up to ${tokenAmount} of your ${tokenSymbol}.`}
      />
    )
  }
}
