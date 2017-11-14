const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountListItem = require('./account-list-item')

module.exports = FromDropdown

inherits(FromDropdown, Component)
function FromDropdown () {
  Component.call(this)
}

FromDropdown.prototype.getListItemIcon = function (currentAccount, selectedAccount) {
  const listItemIcon = h(`i.fa.fa-check.fa-lg`, { style: { color: '#02c9b1' } })

  return currentAccount.address === selectedAccount.address
    ? listItemIcon
    : null
}

FromDropdown.prototype.renderDropdown = function () {
  const {
    accounts,
    selectedAccount,
    closeDropdown,
    onSelect,
  } = this.props

  return h('div', {}, [

    h('div.send-v2__from-dropdown__close-area', {
      onClick: closeDropdown,
    }),

    h('div.send-v2__from-dropdown__list', {}, [

      ...accounts.map(account => h(AccountListItem, {
        className: 'account-list-item__dropdown',
        account,
        handleClick: () => {
          onSelect(account)
          closeDropdown()
        },
        icon: this.getListItemIcon(account, selectedAccount),
      })),

    ]),

  ])
}

FromDropdown.prototype.render = function () {
  const {
    selectedAccount,
    openDropdown,
    dropdownOpen,
  } = this.props

  return h('div.send-v2__from-dropdown', {}, [

    h(AccountListItem, {
      account: selectedAccount,
      handleClick: openDropdown,
      icon: h(`i.fa.fa-caret-down.fa-lg`, { style: { color: '#dedede' } }),
    }),

    dropdownOpen && this.renderDropdown(),

  ])

}

