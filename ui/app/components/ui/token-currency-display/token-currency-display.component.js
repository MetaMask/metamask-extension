import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CurrencyDisplay from '../currency-display'
import { getTokenData } from '../../../helpers/utils/transactions.util'
import { getTokenValue, calcTokenAmount } from '../../../helpers/utils/token-util'

export default class TokenCurrencyDisplay extends PureComponent {
  static propTypes = {
    transactionData: PropTypes.string,
    token: PropTypes.object,
  }

  state = {
    displayValue: '',
    suffix: '',
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
    const { decimals = '', symbol: suffix = '' } = token
    const tokenData = getTokenData(data)

    let displayValue

    if (tokenData && tokenData.params && tokenData.params.length) {
      const tokenValue = getTokenValue(tokenData.params)
      displayValue = calcTokenAmount(tokenValue, decimals).toString()
    }

    this.setState({ displayValue, suffix })
  }

  render () {
    const { displayValue, suffix } = this.state

    return (
      <CurrencyDisplay
        {...this.props}
        displayValue={displayValue}
        suffix={suffix}
      />
    )
  }
}
