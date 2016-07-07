const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const MiniAccountPanel = require('./mini-account-panel')
const addressSummary = require('../util').addressSummary
const readableDate = require('../util').readableDate
const formatBalance = require('../util').formatBalance
const nameForAddress = require('../../lib/contract-namer')

module.exports = PendingTxDetails

inherits(PendingTxDetails, Component)
function PendingTxDetails () {
  Component.call(this)
}

const PTXP = PendingTxDetails.prototype

PTXP.render = function () {
  var state = this.props
  var txData = state.txData

  var txParams = txData.txParams || {}
  var address = txParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

  var isContractDeploy = !('to' in txParams)

  return (
    h('div', [

      h('.flex-row.flex-center', {
        style: {
          maxWidth: '100%',
        },
      }, [

        h(MiniAccountPanel, {
          attrs: [
            identity.name,
            addressSummary(address, 6, 4, false),
            formatBalance(identity.balance),
          ],
          imageSeed: address,
          imageifyIdenticons: state.imageifyIdenticons,
          picOrder: 'right',
        }),

        h('img', {
          src: 'images/forward-carrat.svg',
          style: {
            padding: '5px 6px 0px 10px',
            height: '48px',
          },
        }),

        this.miniAccountPanelForRecipient(),

      ]),

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

PTXP.miniAccountPanelForRecipient = function() {
  var state = this.props
  var txData = state.txData

  var txParams = txData.txParams || {}
  var address = txParams.from || state.selectedAddress
  var identity = state.identities[address] || { address: address }
  var account = state.accounts[address] || { address: address }

  var isContractDeploy = !('to' in txParams)

  // If it's not a contract deploy, send to the account
  if (!isContractDeploy) {
    return h(MiniAccountPanel, {
      attrs: [
        nameForAddress(txParams.to),
        addressSummary(txParams.to, 6, 4, false),
      ],
      imageSeed: address,
      imageifyIdenticons: state.imageifyIdenticons,
      picOrder: 'left',
    })
  } else {
     return h(MiniAccountPanel, {
      attrs: [
        'New Contract'
      ],
      imageifyIdenticons: state.imageifyIdenticons,
      picOrder: 'left',
    })
  }
}

