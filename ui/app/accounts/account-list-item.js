const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')

const EthBalance = require('../components/eth-balance')
const CopyButton = require('../components/copyButton')
const Identicon = require('../components/identicon')

module.exports = NewComponent

inherits(NewComponent, Component)
function NewComponent () {
  Component.call(this)
}

NewComponent.prototype.render = function () {
  const identity = this.props.identity
  var isSelected = this.props.selectedAddress === identity.address
  var account = this.props.accounts[identity.address]
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
        this.pendingOrNot(),
        h(Identicon, {
          address: identity.address,
          imageify: true,
        }),
      ]),

      // account address, balance
      h('.identity-data.flex-column.flex-justify-center.flex-grow.select-none', {
        style: {
          width: '200px',
        },
      }, [
        h('span', identity.name),
        h('span.font-small', {
          style: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          },
        }, ethUtil.toChecksumAddress(identity.address)),
        h(EthBalance, {
          value: account.balance,
          style: {
            lineHeight: '7px',
            marginTop: '10px',
          },
        }),
      ]),

      // copy button
      h('.identity-copy.flex-column', {
        style: {
          margin: '0 20px',
        },
      }, [
        h(CopyButton, {
          value: ethUtil.toChecksumAddress(identity.address),
        }),
      ]),
    ])
  )
}

NewComponent.prototype.pendingOrNot = function () {
  const pending = this.props.pending
  if (pending.length === 0) return null
  return h('.pending-dot', pending.length)
}
