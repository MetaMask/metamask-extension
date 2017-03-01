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
      h('div', [
        h('label.font-small', { style: { display: 'block' } }, 'MESSAGE'),
        h('textarea.font-small', {
          readOnly: true,
          style: {
            width: '315px',
            maxHeight: '210px',
            resize: 'none',
            border: 'none',
            background: 'white',
            padding: '3px',
          },
          defaultValue: data,
        }),
      ]),

    ])
  )
}

