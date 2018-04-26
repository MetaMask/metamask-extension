import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { checksumAddress } from '../../../util'
import Identicon from '../../identicon'
import CurrencyDisplay from '../../send/currency-display'

export default class AccountListItem extends Component {

  static propTypes = {
    account: PropTypes.object,
    className: PropTypes.string,
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    displayAddress: PropTypes.bool,
    displayBalance: PropTypes.bool,
    handleClick: PropTypes.func,
    icon: PropTypes.node,
  };

  render () {
    const {
      className,
      account,
      handleClick,
      icon = null,
      conversionRate,
      currentCurrency,
      displayBalance = true,
      displayAddress = false,
    } = this.props

    const { name, address, balance } = account || {}

    return (<div
      className={`account-list-item ${className}`}
      onClick={() => handleClick({ name, address, balance })}
    >

      <div className='account-list-item__top-row'>
        <Identicon
          address={address}
          diameter={18}
          className='account-list-item__identicon'
        />

        <div className='account-list-item__account-name'>{ name || address }</div>

        {icon && <div className='account-list-item__icon'>{ icon }</div>}

      </div>

      {displayAddress && name && <div className='account-list-item__account-address'>
        { checksumAddress(address) }
      </div>}

      {displayBalance && <CurrencyDisplay
        primaryCurrency='ETH'
        convertedCurrency={currentCurrency}
        value={balance}
        conversionRate={conversionRate}
        readOnly={true}
        className='account-list-item__account-balances'
        primaryBalanceClassName='account-list-item__account-primary-balance'
        convertedBalanceClassName='account-list-item__account-secondary-balance'
      />}

    </div>)
  }
}

AccountListItem.contextTypes = {
  t: PropTypes.func,
}

