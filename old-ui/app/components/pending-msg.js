const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-msg-details')

module.exports = PendingMsg

inherits(PendingMsg, Component)
function PendingMsg () {
  Component.call(this)
}

PendingMsg.prototype.render = function () {
  var state = this.props
  var msgData = state.txData

  return (

    h('div', {
      key: msgData.id,
    }, [

      // header
      h('h3', {
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
        },
      }, 'Sign Message'),

      h('.error', {
        style: {
          margin: '30px',
          width: 'auto',
        },
      }, [
        `Signing this message can have
        dangerous side effects. Only sign messages from
        sites you fully trust with your entire account.
        This dangerous method will be removed in a future version. `,
      ]),

      // message details
      h(PendingTxDetails, state),

      // sign + cancel
      h('.flex-row.flex-space-around', {
        style: {
          marginRight: '30px',
          float: 'right',
          display: 'block',
        }
      }, [
        h('button.btn-violet', {
          onClick: state.cancelMessage,
        }, 'Cancel'),
        h('button', {
          onClick: state.signMessage,
        }, 'Sign'),
      ]),
    ])

  )
}
