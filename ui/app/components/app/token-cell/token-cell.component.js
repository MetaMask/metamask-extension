import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Identicon from '../../ui/identicon'
import { conversionUtil, multiplyCurrencies } from '../../../helpers/utils/conversion-util'
import TokenMenuDropdown from '../dropdowns/token-menu-dropdown.js'

export default class TokenCell extends Component {
  static contextTypes = {
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    address: PropTypes.string,
    symbol: PropTypes.string,
    string: PropTypes.string,
    selectedTokenAddress: PropTypes.string,
    contractExchangeRates: PropTypes.object,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    image: PropTypes.string,
    onClick: PropTypes.func.isRequired,
  }

  state = {
    tokenMenuOpen: false,
  }

  render () {
    const { tokenMenuOpen } = this.state
    const {
      address,
      symbol,
      string,
      selectedTokenAddress,
      contractExchangeRates,
      conversionRate,
      onClick,
      currentCurrency,
      image,
    } = this.props
    let currentTokenToFiatRate
    let currentTokenInFiat
    let formattedFiat = ''

    if (contractExchangeRates[address]) {
      currentTokenToFiatRate = multiplyCurrencies(
        contractExchangeRates[address],
        conversionRate
      )
      currentTokenInFiat = conversionUtil(string, {
        fromNumericBase: 'dec',
        fromCurrency: symbol,
        toCurrency: currentCurrency.toUpperCase(),
        numberOfDecimals: 2,
        conversionRate: currentTokenToFiatRate,
      })
      formattedFiat = currentTokenInFiat.toString() === '0'
        ? ''
        : `${currentTokenInFiat} ${currentCurrency.toUpperCase()}`
    }

    const showFiat = Boolean(currentTokenInFiat) && currentCurrency.toUpperCase() !== symbol

    return (
      <div
        className={classnames(`token-list-item`, {
          'token-list-item--active': selectedTokenAddress === address,
        })}
        onClick={onClick.bind(null, address)}
      >
        <Identicon
          className="token-list-item__identicon"
          diameter={50}
          address={address}
          image={image}
        />
        <div className="token-list-item__balance-ellipsis">
          <div className="token-list-item__balance-wrapper">
            <div className="token-list-item__token-balance">{string || 0}</div>
            <div className="token-list-item__token-symbol">{symbol}</div>
            {showFiat && (
              <div className="token-list-item__fiat-amount">
                {formattedFiat}
              </div>
            )}
          </div>
          <i
            className="fa fa-ellipsis-h fa-lg token-list-item__ellipsis cursor-pointer"
            onClick={(e) => {
              e.stopPropagation()
              this.setState({ tokenMenuOpen: true })
            }}
          />
        </div>
        {tokenMenuOpen && (
          <TokenMenuDropdown
            onClose={() => this.setState({ tokenMenuOpen: false })}
            token={{ symbol, address }}
          />
        )}
      </div>
    )
  }
}
