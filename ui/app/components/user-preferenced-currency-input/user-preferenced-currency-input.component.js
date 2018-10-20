import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CurrencyInput from '../currency-input'

export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    useETHAsPrimaryCurrency: PropTypes.bool,
  }

  render () {
    const { useETHAsPrimaryCurrency, ...restProps } = this.props

    return (
      <CurrencyInput
        {...restProps}
        useFiat={!useETHAsPrimaryCurrency}
      />
    )
  }
}
