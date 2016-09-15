const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const PendingTxDetails = require('./pending-tx-details')

const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

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

        this.buttonDeligator(),

        h('button.cancel', {
          onClick: state.cancelTransaction,
          style: { background: 'rgb(254,35,17)' },
        }, 'Reject'),
      ]),
    ])
  )
}

PendingTx.prototype.buttonDeligator = function () {
  var state = this.props
  var txData = state.txData
  var txParams = txData.txParams || {}
  var address = txParams.from || state.selectedAddress

  var account = state.accounts[address]
  var balance = account ? account.balance : '0x0'

  var gasCost = new BN(ethUtil.stripHexPrefix(txParams.gas || txData.estimatedGas), 16)
  var gasPrice = new BN(ethUtil.stripHexPrefix(txParams.gasPrice || '0x4a817c800'), 16)
  var txFee = gasCost.mul(gasPrice)
  var txValue = new BN(ethUtil.stripHexPrefix(txParams.value || '0x0'), 16)
  var maxCost = txValue.add(txFee)

  var balanceBn = new BN(ethUtil.stripHexPrefix(balance), 16)
  if (maxCost.gt(balanceBn)) {
    return h('button.confirm', {
      onClick: state.sendTransaction,
      style: { background: 'rgb(251,117,1)' },
    }, 'Buy')
  } else {
    return h('button.confirm', {
      onClick: state.sendTransaction,
      style: { background: 'rgb(251,117,1)' },
    }, 'Accept')
  }
}
