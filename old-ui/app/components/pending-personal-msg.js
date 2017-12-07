const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-personal-msg-details')

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

      // message details
      h(PendingTxDetails, state),

      // sign + cancel
      h('.flex-row.flex-space-around', [
        h('button', {
          onClick: state.cancelPersonalMessage,
        }, 'Cancel'),
        h('button', {
          onClick: state.signPersonalMessage,
        }, 'Sign'),
      ]),
    ])

  )
}

