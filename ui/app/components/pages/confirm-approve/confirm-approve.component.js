import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTokenTransactionBase from '../confirm-token-transaction-base'

export default class ConfirmApprove extends Component {
  static propTypes = {
    tokenAmount: PropTypes.number,
  }

  render () {
    const { tokenAmount } = this.props

    return (
      <ConfirmTokenTransactionBase
        tokenAmount={tokenAmount}
      />
    )
  }
}
