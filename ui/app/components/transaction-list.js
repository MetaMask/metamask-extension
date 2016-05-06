const h = require('react-hyperscript')
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')
const Panel = require('./panel')

module.exports = function(transactions, network) {
  return h('section', [

    h('.current-domain-panel.flex-center.font-small', [
      h('span', 'Transactions'),
    ]),

    h('.tx-list', {
        style: {
          overflowY: 'auto',
          height: '180px',
          textAlign: 'center',
        },
      },

      [

        transactions.map((transaction) => {
          console.dir(transaction)

          var panelOpts = {
            key: `tx-${transaction.hash}`,
            identiconKey: transaction.txParams.to,
            style: {
              cursor: 'pointer',
            },
            onClick: (event) => {
              var url = explorerLink(transaction.hash, parseInt(network))
              chrome.tabs.create({ url });
            },
            attributes: [
              {
                key: 'TO',
                value: addressSummary(transaction.txParams.to),
              },
              {
                key: 'VALUE',
                value: formatBalance(transaction.txParams.value),
              },
            ]
          }

          return h(Panel, panelOpts)
        })
      ]
    )

  ])
 }
