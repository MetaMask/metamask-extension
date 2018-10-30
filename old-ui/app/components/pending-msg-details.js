const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const AccountPanel = require('./account-panel')

module.exports = PendingMsgDetails

inherits(PendingMsgDetails, Component)
function PendingMsgDetails () {
  Component.call(this)
}

PendingMsgDetails.prototype.render = function () {
  var state = this.props
  var msgData = state.txData

  var msgParams = msgData.msgParams || {}
  var address = msgParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

  return (
    h('div', {
      key: msgData.id,
      style: {
        margin: '10px 0px',
      },
    }, [

      // account that will sign
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
        imageifyIdenticons: state.imageifyIdenticons,
        style: {
          background: 'transparent',
        },
      }),

      // message data
      h('.tx-data.flex-column.flex-justify-center.flex-grow.select-none', {
        style: {
          margin: '0 30px',
        },
      }, [
        h('.flex-column.flex-space-between', [
          h('label.font-small', {
            style: { color: 'white', margin: '10px 0' },
          }, 'MESSAGE'),
          h('span.font-small', {style: {color: 'white', wordBreak: 'break-word'}}, msgParams.data),
        ]),
      ]),

    ])
  )
}

