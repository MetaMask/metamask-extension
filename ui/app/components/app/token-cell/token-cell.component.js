import classnames from 'classnames'
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import Identicon from '../../ui/identicon'
import { conversionUtil, multiplyCurrencies } from '../../../helpers/utils/conversion-util'
import TokenMenuDropdown from '../dropdowns/token-menu-dropdown.js'
import Tooltip from '../../ui/tooltip-v2'
import { I18nContext } from '../../../contexts/i18n'

export default class TokenCell extends Component {
  static contextType = I18nContext

  static propTypes = {
    address: PropTypes.string,
    outdatedBalance: PropTypes.bool,
    symbol: PropTypes.string,
    string: PropTypes.string,
    selectedTokenAddress: PropTypes.string,
    contractExchangeRates: PropTypes.object,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    image: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    userAddress: PropTypes.string.isRequired,
  }

  static defaultProps = {
    outdatedBalance: false,
  }

  state = {
    tokenMenuOpen: false,
  }

  render () {
    const t = this.context
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
      outdatedBalance,
      userAddress,
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
        className={classnames('token-cell', {
          'token-cell--active': selectedTokenAddress === address,
          'token-cell--outdated': outdatedBalance,
        })}
        onClick={onClick.bind(null, address)}
      >
        <Identicon
          className="token-cell__identicon"
          diameter={50}
          address={address}
          image={image}
        />
        <div className="token-cell__balance-ellipsis">
          <div className="token-cell__balance-wrapper">
            <div className="token-cell__token-balance">{string || 0}</div>
            <div className="token-cell__token-symbol">{symbol}</div>
            {showFiat && (
              <div className="token-cell__fiat-amount">
                {formattedFiat}
              </div>
            )}
          </div>
        </div>
        {
          outdatedBalance && (
            <Tooltip
              interactive
              position="bottom"
              html={(
                <div className="token-cell__outdated-tooltip">
                  { t('troubleTokenBalances') }
                  <a
                    href={`https://ethplorer.io/address/${userAddress}`}
                    rel="noopener noreferrer"
                    target="_blank"
                    style={{ color: '#F7861C' }}
                  >
                    { t('here') }
                  </a>
                </div>
              )}
            >
              <i className={classnames(['fa', 'fa-exclamation-circle', 'token-cell__outdated-icon'])} />
            </Tooltip>
          )
        }

        <div>
          <i
            className="fa fa-ellipsis-h fa-lg token-cell__ellipsis cursor-pointer"
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
