const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-tx-details')
const BN = require('ethereumjs-util').BN
const ethUtil = require('ethereumjs-util')

module.exports = PendingTx

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
}

PendingTx.prototype.render = function () {
  var props = this.props
  var state = this.state || {}
  var txData = props.txData
  var txParams = txData.txParams
  var gasValue = state.gas || txParams.gas
  var decimalGas = decimalize(gasValue)

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
      h('input', {
          value: decimalGas,
          onChange: (event) => {
            const hexString = hexify(event.target.value)
            this.setState({ gas: hexString })
          }
      }),
    ])
  )
}

function decimalize (input) {
  const strippedInput = ethUtil.stripHexPrefix(input)
  const inputBN = new BN(strippedInput, 'hex')
  return inputBN.toString(10)
}

function hexify (decimalString) {
  const hexBN = new BN(decimalString, 10)
  return '0x' + hexBN.toString('hex')
}
