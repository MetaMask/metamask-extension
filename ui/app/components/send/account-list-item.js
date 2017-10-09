const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const Identicon = require('../identicon')

inherits(AccountListItem, Component)
function AccountListItem () {
  Component.call(this)
}

module.exports = AccountListItem

AccountListItem.prototype.render = function () {
  const {
    account, 
    handleClick, 
    icon = null,
  } = this.props

  const { identity, balancesToRender } = account
  const { name, address } = identity
  const { primary, secondary } = balancesToRender

  return h('div.account-list-item', {
    onClick: () => handleClick(identity),
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

      h('div.account-list-item__account-name', {}, name),

      icon && h('div.account-list-item__icon', [icon]),

    ]),

    h('div.account-list-item__account-primary-balance', {}, primary),

    h('div.account-list-item__account-secondary-balance', {}, secondary),

  ])
}