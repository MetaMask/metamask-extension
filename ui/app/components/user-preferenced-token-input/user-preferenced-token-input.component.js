import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TokenInput from '../token-input'

export default class UserPreferencedCurrencyInput extends PureComponent {
  static propTypes = {
    useETHAsPrimaryCurrency: PropTypes.bool,
  }

  render () {
    const { useETHAsPrimaryCurrency, ...restProps } = this.props

    return (
      <TokenInput
        {...restProps}
        showFiat={!useETHAsPrimaryCurrency}
      />
    )
  }
}
