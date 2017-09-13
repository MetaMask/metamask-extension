const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const AccountDropdowns = require('./components/account-dropdowns')

inherits(AccountOptionsDropdown, Component)
function AccountOptionsDropdown () {
  Component.call(this)
}

module.exports = AccountOptionsDropdown

// TODO: specify default props and proptypes
// TODO: hook up to state, connect to redux to clean up API
// TODO: selectedAddress is not defined... should we use selected?
AccountOptionsDropdown.prototype.render = function () {
  // const { selected } = this.props
  const { network, identities, style, dropdownWrapperStyle, menuItemStyles } = this.props

  return h(AccountDropdowns, {
    enableAccountOptions: true,
    enableAccountsSelector: false,
    // selected: selectedAddress,
    network,
    identities,
    style: style || {},
    dropdownWrapperStyle: dropdownWrapperStyle || {},
    menuItemStyles: menuItemStyles || {},
  }, [])
}
