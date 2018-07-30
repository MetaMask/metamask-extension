import React, { Component } from 'react'
import PropTypes from 'prop-types'
import ConfirmTransactionBase from '../confirm-transaction-base'
import {
  formatCurrency,
  convertTokenToFiat,
  addFiat,
  roundExponential,
} from '../../../helpers/confirm-transaction/util'

export default class ConfirmTokenTransactionBase extends Component {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    tokenAddress: PropTypes.string,
    toAddress: PropTypes.string,
    tokenAmount: PropTypes.number,
    tokenSymbol: PropTypes.string,
    fiatTransactionTotal: PropTypes.string,
    ethTransactionTotal: PropTypes.string,
    contractExchangeRate: PropTypes.number,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
  }

  getFiatTransactionAmount () {
    const { tokenAmount, currentCurrency, conversionRate, contractExchangeRate } = this.props

    return convertTokenToFiat({
      value: tokenAmount,
      toCurrency: currentCurrency,
      conversionRate,
      contractExchangeRate,
    })
  }

  getSubtitle () {
    const { currentCurrency, contractExchangeRate } = this.props

    if (typeof contractExchangeRate === 'undefined') {
      return this.context.t('noConversionRateAvailable')
    } else {
      const fiatTransactionAmount = this.getFiatTransactionAmount()
      const roundedFiatTransactionAmount = roundExponential(fiatTransactionAmount)
      return formatCurrency(roundedFiatTransactionAmount, currentCurrency)
    }
  }

  getFiatTotalTextOverride () {
    const { fiatTransactionTotal, currentCurrency, contractExchangeRate } = this.props

    if (typeof contractExchangeRate === 'undefined') {
      return formatCurrency(fiatTransactionTotal, currentCurrency)
    } else {
      const fiatTransactionAmount = this.getFiatTransactionAmount()
      const fiatTotal = addFiat(fiatTransactionAmount, fiatTransactionTotal)
      const roundedFiatTotal = roundExponential(fiatTotal)
      return formatCurrency(roundedFiatTotal, currentCurrency)
    }
  }

  render () {
    const {
      toAddress,
      tokenAddress,
      tokenSymbol,
      tokenAmount,
      ethTransactionTotal,
      ...restProps
    } = this.props

    const tokensText = `${tokenAmount} ${tokenSymbol}`

    return (
      <ConfirmTransactionBase
        toAddress={toAddress}
        identiconAddress={tokenAddress}
        title={tokensText}
        subtitle={this.getSubtitle()}
        ethTotalTextOverride={`${tokensText} + \u2666 ${ethTransactionTotal}`}
        fiatTotalTextOverride={this.getFiatTotalTextOverride()}
        {...restProps}
      />
    )
  }
}
