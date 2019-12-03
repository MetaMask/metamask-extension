import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Identicon from '../../ui/identicon'
const prefixForNetwork = require('../../../../lib/etherscan-prefix-for-network')
const { conversionUtil, multiplyCurrencies } = require('../../../helpers/utils/conversion-util')

const TokenMenuDropdown = require('../dropdowns/token-menu-dropdown.js')

export default class TokenCell extends Component {
  static contextTypes = {
    metricsEvent: PropTypes.func,
  }

  state = {
    tokenMenuOpen: false,
  }

  send (address, event) {
    event.preventDefault()
    event.stopPropagation()
    const url = tokenFactoryFor(address)
    if (url) {
      navigateTo(url)
    }
  }

  view (address, userAddress, network) {
    const url = etherscanLinkFor(address, userAddress, network)
    if (url) {
      navigateTo(url)
    }
  }

  render () {
    const { tokenMenuOpen } = this.state
    const props = this.props
    const {
      address,
      symbol,
      string,
      network,
      setSelectedToken,
      selectedTokenAddress,
      contractExchangeRates,
      conversionRate,
      hideSidebar,
      sidebarOpen,
      currentCurrency,
      // userAddress,
      image,
    } = props
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
        onClick={() => {
          setSelectedToken(address)
          this.context.metricsEvent({
            eventOpts: {
              category: 'Navigation',
              action: 'Token Menu',
              name: 'Clicked Token',
            },
          })
          selectedTokenAddress !== address && sidebarOpen && hideSidebar()
        }}
      >
        <Identicon
          className="token-list-item__identicon"
          diameter={50}
          address={address}
          network={network}
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

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function etherscanLinkFor (tokenAddress, address, network) {
  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/token/${tokenAddress}?a=${address}`
}

function tokenFactoryFor (tokenAddress) {
  return `https://tokenfactory.surge.sh/#/token/${tokenAddress}`
}

