import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTransactionBase from '../confirm-transaction-base'
import ConfirmApproveContent from './confirm-approve-content'
import { getCustomTxParamsData } from './confirm-approve.util'
import {
  calcTokenAmount,
} from '../../helpers/utils/token-util'

export default class ConfirmApprove extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    tokenAddress: PropTypes.string,
    toAddress: PropTypes.string,
    tokenAmount: PropTypes.string,
    tokenSymbol: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    contractExchangeRate: PropTypes.number,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    showCustomizeGasModal: PropTypes.func,
    showEditApprovalPermissionModal: PropTypes.func,
    origin: PropTypes.string,
    siteImage: PropTypes.string,
    tokenTrackerBalance: PropTypes.string,
    data: PropTypes.string,
    decimals: PropTypes.number,
    txData: PropTypes.object,
  }

  static defaultProps = {
    tokenAmount: '0',
  }

  state = {
    customPermissionAmount: '',
  }

  componentDidUpdate (prevProps) {
    const { tokenAmount } = this.props

    if (tokenAmount !== prevProps.tokenAmount) {
      this.setState({ customPermissionAmount: tokenAmount })
    }
  }

  render () {
    const {
      toAddress,
      tokenAddress,
      tokenSymbol,
      tokenAmount,
      showCustomizeGasModal,
      showEditApprovalPermissionModal,
      origin,
      siteImage,
      tokenTrackerBalance,
      data,
      decimals,
      txData,
      currentCurrency,
      ethTransactionTotal,
      fiatTransactionTotal,
      ...restProps
    } = this.props
    const { customPermissionAmount } = this.state

    const tokensText = `${Number(tokenAmount)} ${tokenSymbol}`

    const tokenBalance = tokenTrackerBalance
      ? calcTokenAmount(tokenTrackerBalance, decimals).toString(10)
      : ''

    const customData = customPermissionAmount
      ? getCustomTxParamsData(data, { customPermissionAmount, decimals })
      : null

    return (
      <ConfirmTransactionBase
        toAddress={toAddress}
        identiconAddress={tokenAddress}
        showAccountInHeader
        title={tokensText}
        contentComponent={(
          <ConfirmApproveContent
            decimals={decimals}
            siteImage={siteImage}
            setCustomAmount={(newAmount) => {
              this.setState({ customPermissionAmount: newAmount })
            }}
            customTokenAmount={String(customPermissionAmount)}
            tokenAmount={tokenAmount}
            origin={origin}
            tokenSymbol={tokenSymbol}
            tokenBalance={tokenBalance}
            showCustomizeGasModal={() => showCustomizeGasModal(txData)}
            showEditApprovalPermissionModal={showEditApprovalPermissionModal}
            data={customData || data}
            toAddress={toAddress}
            currentCurrency={currentCurrency}
            ethTransactionTotal={ethTransactionTotal}
            fiatTransactionTotal={fiatTransactionTotal}
          />
        )}
        hideSenderToRecipient
        customTxParamsData={customData}
        {...restProps}
      />
    )
  }
}
