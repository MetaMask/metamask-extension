const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-tx-details')
const HexInput = require('./hex-as-decimal-input')

module.exports = PendingTx

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
}

PendingTx.prototype.render = function () {
  const props = this.props
  const state = this.state || {}
  const txData = props.txData
  const txParams = txData.txParams

  const gas = state.gas || txParams.gas
  const gasPrice = state.gasPrice || txData.gasPrice

  return (

    h('div', {
      key: txData.id,
    }, [

      // tx info
      h(PendingTxDetails, props),

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

      props.insufficientBalance ?
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

        props.insufficientBalance ?
          h('button.btn-green', {
            onClick: props.buyEth,
          }, 'Buy Ether')
        : null,

        h('button.confirm', {
          disabled: props.insufficientBalance,
          onClick: props.sendTransaction,
        }, 'Accept'),

        h('button.cancel.btn-red', {
          onClick: props.cancelTransaction,
        }, 'Reject'),
      ]),

      h(HexInput, {
        value: gas,
        onChange: (newHex) => {
          this.setState({ gas: newHex })
        },
      }),

      h(HexInput, {
        value: gasPrice,
        onChange: (newHex) => {
          this.setState({ gasPrice: newHex })
        },
      }),

    ])
  )
}
