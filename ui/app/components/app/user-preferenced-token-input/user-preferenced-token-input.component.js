import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TokenInput from '../../ui/token-input'

export default class UserPreferencedTokenInput extends PureComponent {
  static propTypes = {
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
  }

  render () {
    const { useNativeCurrencyAsPrimaryCurrency, ...restProps } = this.props

    return (
      <TokenInput
        {...restProps}
        showFiat={!useNativeCurrencyAsPrimaryCurrency}
      />
    )
  }
}
