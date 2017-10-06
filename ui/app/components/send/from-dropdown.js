const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('../identicon')

module.exports = FromDropdown

inherits(FromDropdown, Component)
function FromDropdown () {
  Component.call(this)
}

FromDropdown.prototype.renderSingleIdentity = function (
  account, 
  handleClick, 
  inList = false, 
  selectedIdentity = {}
) {
  const { identity, balancesToRender } = account
  const { name, address } = identity
  const { primary, secondary } = balancesToRender

  const iconType = inList ? 'check' : 'caret-down'
  const showIcon = !inList || address === selectedIdentity.address

  return h('div.send-v2__from-dropdown__account', {
    onClick: () => handleClick(identity),
  }, [

    h('div.send-v2__from-dropdown__top-row', {}, [

      h(
        Identicon,
        {
          address,
          diameter: 18,
          className: 'send-v2__from-dropdown__identicon',
        },
      ),  

      h('div.send-v2__from-dropdown__account-name', {}, name),

      showIcon && h(`i.fa.fa-${iconType}.fa-lg.send-v2__from-dropdown__${iconType}`),

    ]),

    h('div.send-v2__from-dropdown__account-primary-balance', {}, primary),

    h('div.send-v2__from-dropdown__account-secondary-balance', {}, secondary),

  ])
}

FromDropdown.prototype.renderDropdown = function (identities, selectedIdentity, closeDropdown) {
  return h('div', {}, [

    h('div.send-v2__from-dropdown__close-area', {
      onClick: closeDropdown,
    }),

    h('div.send-v2__from-dropdown__list', {}, [

      ...identities.map(identity => this.renderSingleIdentity(
        identity,
        () => console.log('Select identity'),
        true,
        selectedIdentity
      ))

    ]),

  ])
}

FromDropdown.prototype.render = function () {
  const {
    identities,
    selectedIdentity,
    setFromField,
    openDropdown,
    closeDropdown,
    dropdownOpen,
  } = this.props

  return h('div.send-v2__from-dropdown', {}, [

    this.renderSingleIdentity(selectedIdentity, openDropdown),

    dropdownOpen && this.renderDropdown(identities, selectedIdentity.identity, closeDropdown),

  ])
    
}

