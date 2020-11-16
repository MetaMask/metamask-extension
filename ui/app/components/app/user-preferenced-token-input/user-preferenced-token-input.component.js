import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TokenInput from '../../ui/token-input'

export default class UserPreferencedTokenInput extends PureComponent {
  static propTypes = {
    token: PropTypes.shape({
      address: PropTypes.string.isRequired,
      decimals: PropTypes.number,
      symbol: PropTypes.string,
    }).isRequired,
    useNativeCurrencyAsPrimaryCurrency: PropTypes.bool,
  }

  render() {
    const { useNativeCurrencyAsPrimaryCurrency, ...restProps } = this.props

    return (
      <TokenInput
        {...restProps}
        showFiat={!useNativeCurrencyAsPrimaryCurrency}
      />
    )
  }
}
