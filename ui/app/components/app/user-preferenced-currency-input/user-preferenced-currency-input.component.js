import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import CurrencyInput from '../../ui/currency-input'

export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
  }

  render() {
    const { useNativeCurrencyAsPrimaryCurrency, ...restProps } = this.props

    return (
      <CurrencyInput
        {...restProps}
        useFiat={!useNativeCurrencyAsPrimaryCurrency}
      />
    )
  }
}
