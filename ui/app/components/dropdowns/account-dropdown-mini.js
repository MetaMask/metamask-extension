const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountListItem = require('../send/account-list-item/account-list-item.component').default

module.exports = AccountDropdownMini

inherits(AccountDropdownMini, Component)
function AccountDropdownMini () {
  Component.call(this)
}

AccountDropdownMini.prototype.getListItemIcon = function (currentAccount, selectedAccount) {
  const listItemIcon = h(`i.fa.fa-check.fa-lg`, { style: { color: '#02c9b1' } })

  return currentAccount.address === selectedAccount.address
    ? listItemIcon
    : null
}

AccountDropdownMini.prototype.renderDropdown = function () {
  const {
    accounts,
    selectedAccount,
    closeDropdown,
    onSelect,
  } = this.props

  return h('div', {}, [

    h('div.account-dropdown-mini__close-area', {
      onClick: closeDropdown,
    }),

    h('div.account-dropdown-mini__list', {}, [

      ...accounts.map(account => h(AccountListItem, {
        account,
        displayBalance: false,
        displayAddress: false,
        handleClick: () => {
          onSelect(account)
          closeDropdown()
        },
        icon: this.getListItemIcon(account, selectedAccount),
      })),

    ]),

  ])
}

AccountDropdownMini.prototype.render = function () {
  const {
    selectedAccount,
    openDropdown,
    dropdownOpen,
  } = this.props

  return h('div.account-dropdown-mini', {}, [

    h(AccountListItem, {
      account: selectedAccount,
      handleClick: openDropdown,
      displayBalance: false,
      displayAddress: false,
      icon: h(`i.fa.fa-caret-down.fa-lg`, { style: { color: '#dedede' } }),
    }),

    dropdownOpen && this.renderDropdown(),

  ])

}

