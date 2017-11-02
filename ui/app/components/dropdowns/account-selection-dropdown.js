const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountDropdowns = require('./components/account-dropdowns')

inherits(AccountSelectionDropdown, Component)
function AccountSelectionDropdown () {
  Component.call(this)
}

module.exports = AccountSelectionDropdown

// TODO: specify default props and proptypes
// TODO: hook up to state, connect to redux to clean up API
// TODO: selectedAddress is not defined... should we use selected?
AccountSelectionDropdown.prototype.render = function () {
  const { selected, network, identities, style, dropdownWrapperStyle, menuItemStyles } = this.props

  return h(AccountDropdowns, {
    enableAccountOptions: false,
    enableAccountsSelector: true,
    selected,
    network,
    identities,
    style: style || {},
    dropdownWrapperStyle: dropdownWrapperStyle || {},
    menuItemStyles: menuItemStyles || {},
  }, [])
}
