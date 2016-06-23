const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const AccountPanel = require('./account-panel')
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

    h('.transaction', {
      key: txData.id,
    }, [

      h('h3', {
        style: {
          fontWeight: 'bold',
          textAlign: 'center',
        },
      }, 'Submit Transaction'),

      // account that will sign
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
      }),

      // tx data
      h('.tx-data.flex-column.flex-justify-center.flex-grow.select-none', [

        h('.flex-row.flex-space-between', [
          h('label.font-small', 'TO ADDRESS'),
          h('span.font-small', addressSummary(txParams.to)),
        ]),

        h('.flex-row.flex-space-between', [
          h('label.font-small', 'DATE'),
          h('span.font-small', readableDate(txData.time)),
        ]),

        h('.flex-row.flex-space-between', [
          h('label.font-small', 'AMOUNT'),
          h('span.font-small', formatBalance(txParams.value)),
        ]),
      ]),

      // send + cancel
      state.nonInteractive ? null : actionButtons(state),

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