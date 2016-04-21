const h = require('react-hyperscript')
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')

module.exports = function(transactions, network) {
  return h('details', [

    h('summary', [
      h('div.font-small', {style: {display: 'inline'}}, 'Transactions'),
    ]),

    h('.flex-row.flex-space-around', [
      h('div.font-small','To'),
      h('div.font-small','Amount'),
    ]),

    h('.tx-list', {
        style: {
          overflowY: 'auto',
          height: '180px',
        },
      },

      transactions.map((transaction) => {
        return h('.tx.flex-row.flex-space-around', [
          h('a.font-small',
          {
            href: explorerLink(transaction.hash, parseInt(network)),
            target: '_blank',
          },
          addressSummary(transaction.txParams.to)),
          h('div.font-small', formatBalance(transaction.txParams.value))
        ])
      })
    )

  ])
}
