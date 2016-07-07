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

      // tx info
      h(PendingTxDetails, state),

      h('style', `
        .conf-buttons button {
          margin-left: 10px;
          text-transform: uppercase;
        }
      `),

      // send + cancel
      h('.flex-row.flex-space-around.conf-buttons', {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '14px 25px',
        },
      }, [
        h('button.confirm', {
          onClick: state.sendTransaction,
          style: { background: 'rgb(251,117,1)' },
        }, 'Accept'),

        h('button.cancel', {
          onClick: state.cancelTransaction,
          style: { background: 'rgb(254,35,17)' },
        }, 'Reject'),
      ]),
    ])
  )
}

