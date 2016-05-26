const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const TransactionListItem = require('./transaction-list-item')

module.exports = TransactionList


inherits(TransactionList, Component)
function TransactionList() {
  Component.call(this)
}

TransactionList.prototype.render = function() {
  const { txsToRender, network, unconfTxs, unconfMsgs } = this.props
  const transactions = txsToRender.concat(unconfMsgs)
  .sort((a, b) => b.time - a.time)

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
          transactions.map((transaction, i) => {
            return h(TransactionListItem, {
              transaction, i,
              showTx:(txId) => {
                this.props.viewPendingTx(txId)
              },
            })
          })
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

