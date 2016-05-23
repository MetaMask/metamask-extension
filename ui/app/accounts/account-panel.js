const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')

const EtherBalance = require('../components/eth-balance')
const addressSummary = require('../util').addressSummary
const copyToClipboard = require('copy-to-clipboard')
const Identicon = require('../components/identicon')

module.exports = NewComponent


inherits(NewComponent, Component)
function NewComponent() {
  Component.call(this)
}

NewComponent.prototype.render = function() {
  const identity = this.props.identity
  var mayBeFauceting = identity.mayBeFauceting
  var isSelected = this.props.selectedAddress === identity.address
  var account = this.props.accounts[identity.address]
  var isFauceting = mayBeFauceting && account.balance === '0x0'
  const selectedClass = isSelected ? '.selected' : ''

  return (
    h(`.accounts-list-option.flex-row.flex-space-between.pointer.hover-white${selectedClass}`, {
      key: `account-panel-${identity.address}`,
      style: {
        flex: '1 0 auto',
      },
      onClick: (event) => this.props.onShowDetail(identity.address, event),
    }, [

      h('.identicon-wrapper.flex-column.flex-center.select-none', [
        h(Identicon, {
          address: identity.address
        }),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', [

        h('span', identity.name),
        h('span.font-small', addressSummary(identity.address)),
        h(EtherBalance, {
          value: account.balance,
        }),
      ]),

      h('.identity-copy.flex-column', [
        h('i.fa.fa-clipboard.fa-md.cursor-pointer.color-orange', {
          onClick: (event) => {
            event.stopPropagation()
            event.preventDefault()
            copyToClipboard(ethUtil.toChecksumAddress(identity.address))
          }
        }),
      ])
    ])
  )
}
