const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const AccountPanel = require('./account-panel')
const addressSummary = require('../util').addressSummary
const readableDate = require('../util').readableDate
const formatBalance = require('../util').formatBalance
const dataSize = require('../util').dataSize

module.exports = PendingMsg

inherits(PendingMsg, Component)
function PendingMsg () {
  Component.call(this)
}

PendingMsg.prototype.render = function () {
  var state = this.props
  var msgData = state.txData

  var msgParams = msgData.msgParams || {}
  var address = msgParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

  return (
    h('.transaction', {
      key: msgData.id,
    }, [

      h('h3', {
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
        },
      }, 'Sign Message'),

      // account that will sign
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
      }),

      // tx data
      h('.tx-data.flex-column.flex-justify-center.flex-grow.select-none', [
        h('.flex-row.flex-space-between', [
          h('label.font-small', 'DATE'),
          h('span.font-small', readableDate(msgData.time)),
        ]),

        h('.flex-row.flex-space-between', [
          h('label.font-small', 'MESSAGE'),
          h('span.font-small', msgParams.data),
        ]),
      ]),

      // send + cancel
      h('.flex-row.flex-space-around', [
        h('button', {
          onClick: state.cancelMessage,
        }, 'Cancel'),
        h('button', {
          onClick: state.signMessage,
        }, 'Sign'),
      ]),
    ])
  )
}

