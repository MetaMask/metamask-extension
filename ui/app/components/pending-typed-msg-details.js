const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const AccountPanel = require('./account-panel')
const TypedMessageRenderer = require('./typed-message-renderer')

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

  var { data } = msgParams

  return (
    h('div', {
      key: msgData.id,
      style: {
        margin: '10px 20px',
      },
    }, [

      // account that will sign
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
        imageifyIdenticons: state.imageifyIdenticons,
      }),

      // message data
      h('div', {
        style: {
          height: '260px',
        },
      }, [
        h('label.font-small', { style: { display: 'block' } }, 'YOU ARE SIGNING'),
        h(TypedMessageRenderer, {
          value: data,
          style: {
            height: '215px',
          },
        }),
      ]),

    ])
  )
}
