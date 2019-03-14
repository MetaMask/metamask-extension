import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { PRIMARY, SECONDARY, ETH } from '../../../helpers/constants/common'
import CurrencyDisplay from '../../ui/currency-display'

export default class UserPreferencedCurrencyDisplay extends PureComponent {
  static propTypes = {
    className: PropTypes.string,
    prefix: PropTypes.string,
    value: PropTypes.string,
    numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    hideLabel: PropTypes.bool,
    hideTitle: PropTypes.bool,
    style: PropTypes.object,
    showEthLogo: PropTypes.bool,
    ethLogoHeight: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    // Used in container
    type: PropTypes.oneOf([PRIMARY, SECONDARY]),
    ethNumberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    fiatNumberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    ethPrefix: PropTypes.string,
    fiatPrefix: PropTypes.string,
    // From container
    currency: PropTypes.string,
    nativeCurrency: PropTypes.string,
  }

  renderEthLogo () {
    const { currency, showEthLogo, ethLogoHeight = 12 } = this.props

    return currency === ETH && showEthLogo && (
      <img
        src="/images/eth.svg"
        height={ethLogoHeight}
      />
    )
  }

  render () {
    return (
      <CurrencyDisplay
        {...this.props}
        prefixComponent={this.renderEthLogo()}
      />
    )
  }
}
