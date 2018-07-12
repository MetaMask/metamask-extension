import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTransactionBase from '../confirm-transaction-base'

export default class ConfirmApprove extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    tokenAddress: PropTypes.string,
    toAddress: PropTypes.string,
    tokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
  }

  render () {
    const { toAddress, tokenAddress, tokenAmount, tokenSymbol } = this.props

    return (
      <ConfirmTransactionBase
        toAddress={toAddress}
        identiconAddress={tokenAddress}
        title={`${tokenAmount} ${tokenSymbol}`}
        warning={`By approving this action, you grant permission for this contract to spend up to ${tokenAmount} of your ${tokenSymbol}.`}
        hideSubtitle
      />
    )
  }
}
