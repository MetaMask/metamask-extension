const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const AccountPanel = require('./account-panel')
const addressSummary = require('../util').addressSummary
const readableDate = require('../util').readableDate
const formatBalance = require('../util').formatBalance

module.exports = PendingTxDetails

inherits(PendingTxDetails, Component)
function PendingTxDetails () {
  Component.call(this)
}

PendingTxDetails.prototype.render = function () {
  var state = this.props
  return this.renderGeneric(h, state)
}

PendingTxDetails.prototype.renderGeneric = function (h, state) {
  var txData = state.txData

  var txParams = txData.txParams || {}
  var address = txParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

  return (

    h('div', [

      // account that will sign
      h(AccountPanel, {
        showFullAddress: true,
        identity: identity,
        account: account,
        imageifyIdenticons: state.imageifyIdenticons,
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

    ])
    
  )

}
