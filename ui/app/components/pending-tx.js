const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const AccountPanel = require('./account-panel')
const PendingTxDetails = require('./pending-tx-details')
const addressSummary = require('../util').addressSummary
const readableDate = require('../util').readableDate
const formatBalance = require('../util').formatBalance

module.exports = PendingTx

inherits(PendingTx, Component)
function PendingTx () {
  Component.call(this)
}

PendingTx.prototype.render = function () {
  var state = this.props
  return this.renderGeneric(h, state)
}

PendingTx.prototype.renderGeneric = function (h, state) {
  var txData = state.txData

  var txParams = txData.txParams || {}
  var address = txParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

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
      actionButtons(state),

    ])
    
  )

}

function actionButtons(state){
  return (

    h('.flex-row.flex-space-around', [
      h('button', {
        onClick: state.cancelTransaction,
      }, 'Cancel'),
      h('button', {
        onClick: state.sendTransaction,
      }, 'Send'),
    ])

  )
}