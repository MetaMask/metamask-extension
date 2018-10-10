import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CurrencyDisplay from '../currency-display/currency-display.component'
import { getTokenData } from '../../helpers/transactions.util'
import { getTokenValue, calcTokenAmount } from '../../token-util'

export default class TokenCurrencyDisplay extends PureComponent {
  static propTypes = {
    transactionData: PropTypes.string,
    token: PropTypes.object,
  }

  state = {
    displayValue: '',
  }

  componentDidMount () {
    this.setDisplayValue()
  }

  componentDidUpdate (prevProps) {
    const { transactionData } = this.props
    const { transactionData: prevTransactionData } = prevProps

    if (transactionData !== prevTransactionData) {
      this.setDisplayValue()
    }
  }

  setDisplayValue () {
    const { transactionData: data, token } = this.props
    const { decimals = '', symbol = '' } = token
    const tokenData = getTokenData(data)

    let displayValue

    if (tokenData.params && tokenData.params.length) {
      const tokenValue = getTokenValue(tokenData.params)
      const tokenAmount = calcTokenAmount(tokenValue, decimals)
      displayValue = `${tokenAmount} ${symbol}`
    }

    this.setState({ displayValue })
  }

  render () {
    return (
      <CurrencyDisplay
        {...this.props}
        displayValue={this.state.displayValue}
      />
    )
  }
}
