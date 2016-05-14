const h = require('react-hyperscript')
const vreme = new (require('vreme'))
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')
const Panel = require('./panel')

module.exports = function(transactions, network) {
  return (

    h('section.transaction-list', [

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
        },
      }, [
        'Transactions',
      ]),

      h('.tx-list', {
        style: {
          overflowY: 'auto',
          height: '204px',
          padding: '0 20px',
          textAlign: 'center',
        },
      }, (

        transactions.length ?
          transactions.map(renderTransaction)
        :
          [h('.flex-center', {
            style: {
              height: '100%',
            },
          }, 'No transaction history...')]

      ))

    ])

  )
 }

function renderTransaction(transaction){

  var panelOpts = {
    key: `tx-${transaction.hash}`,
    identiconKey: transaction.txParams.to,
    onClick: (event) => {
      var url = explorerLink(transaction.hash, parseInt(network))
      chrome.tabs.create({ url })
    },
    attributes: [
      {
        key: 'TIME',
        value: formatDate(transaction.time),
      },
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
}

function formatDate(date){
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}