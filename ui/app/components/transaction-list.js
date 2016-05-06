const h = require('react-hyperscript')
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')

module.exports = function(transactions, network) {
  return h('.tx-list', {
      style: {
        overflowY: 'auto',
        height: '180px',
        textAlign: 'center',
      },
    },

    [
      h('div.font-small', {style: {display: 'inline'}}, 'Transactions'),

      transactions.map((transaction) => {
        return h('.tx.flex-row.flex-space-around', {
          key: `listed-tx-${transaction.hash}`,
        }, [
          h('a.font-small',
          {
            href: explorerLink(transaction.hash, parseInt(network)),
            target: '_blank',
          },
          addressSummary(transaction.txParams.to)),
          h('div.font-small', formatBalance(transaction.txParams.value))
        ])
      })
    ]
  )
}
