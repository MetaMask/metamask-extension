const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const Identicon = require('../identicon')
const CurrencyDisplay = require('./currency-display')
const { conversionRateSelector, getCurrentCurrency } = require('../../selectors')

inherits(AccountListItem, Component)
function AccountListItem () {
  Component.call(this)
}

function mapStateToProps (state) {
  return {
    conversionRate: conversionRateSelector(state),
    currentCurrency: getCurrentCurrency(state),
  }
}

module.exports = connect(mapStateToProps)(AccountListItem)

AccountListItem.prototype.render = function () {
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

  return h('div.account-list-item', {
    className,
    onClick: () => handleClick({ name, address, balance }),
  }, [

    h('div.account-list-item__top-row', {}, [

      h(
        Identicon,
        {
          address,
          diameter: 18,
          className: 'account-list-item__identicon',
        },
      ),

      h('div.account-list-item__account-name', {}, name || address),

      icon && h('div.account-list-item__icon', [icon]),

    ]),

    displayAddress && name && h('div.account-list-item__account-address', address),

    displayBalance && h(CurrencyDisplay, {
      primaryCurrency: 'ETH',
      convertedCurrency: currentCurrency,
      value: balance,
      conversionRate,
      readOnly: true,
      className: 'account-list-item__account-balances',
      primaryBalanceClassName: 'account-list-item__account-primary-balance',
      convertedBalanceClassName: 'account-list-item__account-secondary-balance',
    }, name),

  ])
}
