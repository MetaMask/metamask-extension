const h = require('react-hyperscript')
const vreme = new (require('vreme'))
const formatBalance = require('../util').formatBalance
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')
const Panel = require('./panel')
const Identicon = require('./identicon')
const EtherBalance = require('./eth-balance')


module.exports = function(transactions, network) {
  return (

    h('section.transaction-list', [

      h('style', `
        .transaction-list .transaction-list-item:not(:last-of-type) {
          border-bottom: 1px solid #D4D4D4;
        }
        .transaction-list .transaction-list-item .ether-balance-label {
          display: block !important;
          font-size: small;
        }
      `),

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


  function renderTransaction(transaction, i){

    var txParams = transaction.txParams
    var date = formatDate(transaction.time)

    return (

      h(`.transaction-list-item.flex-row.flex-space-between${transaction.hash ? '.pointer' : ''}`, {
        key: `tx-${transaction.id + i}`,
        onClick: (event) => {
          if (!transaction.hash) return
          var url = explorerLink(transaction.hash, parseInt(network))
          chrome.tabs.create({ url })
        },
        style: {
          padding: '20px 0',
        },
      }, [

        // large identicon
        h('.identicon-wrapper.flex-column.flex-center.select-none', [
          identicon(txParams, transaction),
        ]),

        h('.flex-column', [

          h('div', date),

          recipientField(txParams, transaction),

        ]),

        h(EtherBalance, {
          value: txParams.value,
        }),
      ])

    )
  }
}

function recipientField(txParams, transaction) {
  if (txParams.to) {
    return h('div', {
      style: {
        fontSize: 'small',
        color: '#ABA9AA',
      },
    }, [
      addressSummary(txParams.to),
      failIfFailed(transaction),
    ])

  } else {

    return h('div', {
      style: {
        fontSize: 'small',
        color: '#ABA9AA',
      },
    },[
      'Contract Published',
      failIfFailed(transaction),
    ])

  }
}

function formatDate(date){
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}

function identicon(txParams, transaction) {
  if (transaction.status === 'rejected') {
    return h('i.fa.fa-exclamation-triangle.fa-lg.error', {
      style: {
        width: '24px',
      }
    })
  }

  if (txParams.to) {
    return h(Identicon, {
      diameter: 24,
      address: txParams.to || transaction.hash,
    })
  } else {
    return h('i.fa.fa-file-text-o.fa-lg', {
      style: {
        width: '24px',
      }
    })
  }
}

function failIfFailed(transaction) {
  if (transaction.status === 'rejected') {
    return h('span.error', ' (Failed)')
  }
}
