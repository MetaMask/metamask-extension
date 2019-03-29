import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CurrencyDisplay from '../currency-display'

export default class TokenBalance extends PureComponent {
  static propTypes = {
    string: PropTypes.string,
    symbol: PropTypes.string,
    error: PropTypes.string,
    className: PropTypes.string,
    withSymbol: PropTypes.bool,
  }

  render () {
    const { className, string, symbol } = this.props

    return (
      <CurrencyDisplay
        className={className}
        displayValue={string}
        suffix={symbol}
      />
    )
  }
}
