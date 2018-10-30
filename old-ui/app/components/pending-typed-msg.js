const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-typed-msg-details')

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
      style: {
        height: '100%'
      }
    }, [

      // header
      h('h3', {
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'white',
          margin: '20px',
        },
      }, 'Sign Message'),

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
        h('button', {
          style: {
            marginRight: '10px'
          },
          onClick: state.cancelTypedMessage,
        }, 'Cancel'),
        h('button', {
          onClick: state.signTypedMessage,
        }, 'Sign'),
      ]),
    ])

  )
}
