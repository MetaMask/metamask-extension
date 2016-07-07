const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-tx-details')


module.exports = PendingTx

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
}

PendingTx.prototype.render = function () {
  var state = this.props
  var txData = state.txData

  return (

    h('div', {
      key: txData.id,
    }, [

      // header
      h('h3', {
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
        },
      }, 'Submit Transaction'),

      // tx info
      h(PendingTxDetails, state),

      // send + cancel
      h('.flex-row.flex-space-around', {
        style: {
          marginTop: '14px',
        }
      }, [
        h('button', {
          onClick: state.cancelTransaction,
        }, 'Reject'),
        h('button', {
          onClick: state.sendTransaction,
        }, 'Approve'),
      ]),

    ])

  )

}
