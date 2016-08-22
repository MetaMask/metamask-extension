const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const genAccountLink = require('../../lib/account-link')
const extension = require('../../../app/scripts/lib/extension')

const TransactionListItem = require('./transaction-list-item')

module.exports = TransactionList


inherits(TransactionList, Component)
function TransactionList () {
  Component.call(this)
}

TransactionList.prototype.render = function () {
  const { txsToRender, network, unconfMsgs, address } = this.props
  const transactions = txsToRender.concat(unconfMsgs)
  var shapeShiftTxList
  if (network === '1'){
    shapeShiftTxList = this.props.shapeShiftTxList
  }
  const transactions = !shapeShiftTxList ? txsToRender.concat(unconfMsgs) : txsToRender.concat(unconfMsgs, shapeShiftTxList)
  .sort((a, b) => b.time - a.time)
  const accountLink = genAccountLink(address, network)

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
          paddingTop: '4px',
          paddingBottom: '4px',
        },
      }, [
        'Transactions',
      ]),

      h('.tx-list', {
        style: {
          overflowY: 'auto',
          height: '300px',
          padding: '0 20px',
          textAlign: 'center',
        },
      }, [

        transactions.length
          ? transactions.map((transaction, i) => {
            return h(TransactionListItem, {
              transaction, i, network,
              showTx: (txId) => {
                this.props.viewPendingTx(txId)
              },
            })
          }).concat(viewMoreButton(accountLink))
        : h('.flex-center', {
          style: {
            flexDirection: 'column',
            height: '100%',
          },
        }, [
          'No transaction history.',
          viewMoreButton(accountLink),
        ]),
      ]),
    ])
  )
}

function viewMoreButton(url) {
  return url ? h('button', {
    style: {
      margin: '10px',
    },
    onClick: (ev) => {
      ev.preventDefault()
      extension.tabs.create({ url })
    },
  }, 'Show More') : null
}
