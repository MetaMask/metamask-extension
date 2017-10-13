const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../actions')
const { Menu, Item, Divider } = require('../dropdowns/components/menu')

module.exports = connect(mapStateToProps, mapDispatchToProps)(AccountMenu)

inherits(AccountMenu, Component)
function AccountMenu () { Component.call(this) }

function mapStateToProps (state) {
  return {
    selectedAddress: state.metamask.selectedAddress,
  }
}

function mapDispatchToProps () {
  return {}
}

AccountMenu.prototype.render = function () {
  return h(Menu, { className: 'account-menu' }, [
    h(Item, { className: 'account-menu__header' }, [
      'My Accounts',
      h('button.account-menu__logout-button', 'Log out'),
    ]),
    h(Divider),
    h(Item, { text: 'hi' }),
    h(Divider),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/plus-btn-white.svg' }),
      text: 'Create Account',
    }),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/import-account.svg' }),
      text: 'Import Account',
    }),
    h(Divider),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/mm-info-icon.svg' }),
      text: 'Info & Help',
    }),
    h(Item, {
      onClick: true,
      icon: h('img', { src: 'images/settings.svg' }),
      text: 'Settings',
    }),
  ])
}


