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

      txData.simulationFails ?
        h('.error', {
          style: {
            marginLeft: 50,
            fontSize: '0.9em',
          },
        }, 'Transaction Error. Exception thrown in contract code.')
      : null,

      state.insufficientBalance ?
        h('span.error', {
          style: {
            marginLeft: 50,
            fontSize: '0.9em',
          },
        }, 'Insufficient balance for transaction')
      : null,

      // send + cancel
      h('.flex-row.flex-space-around.conf-buttons', {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          margin: '14px 25px',
        },
      }, [

        state.insufficientBalance ?
          h('button.btn-green', {
            onClick: state.buyEth,
          }, 'Buy Ether')
        : null,

        h('button.confirm', {
          disabled: state.insufficientBalance,
          onClick: state.sendTransaction,
        }, 'Accept'),

        h('button.cancel.btn-red', {
          onClick: state.cancelTransaction,
        }, 'Reject'),
      ]),
    ])
  )
}
