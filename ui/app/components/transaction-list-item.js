const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const EtherBalance = require('./eth-balance')
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')
const formatBalance = require('../util').formatBalance
const vreme = new (require('vreme'))

const TransactionIcon = require('./transaction-list-item-icon')

module.exports = TransactionListItem


inherits(TransactionListItem, Component)
function TransactionListItem() {
  Component.call(this)
}

TransactionListItem.prototype.render = function() {
  const { transaction, i } = this.props

  var date = formatDate(transaction.time)

  var isMsg = ('msgParams' in transaction)
  var isTx = ('txParams' in transaction)

  let txParams
  if (isTx) {
    txParams = transaction.txParams
  } else if (isMsg) {
    txParams = transaction.msgParams
  }

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
        transaction.status === 'unconfirmed' ? h('.red-dot', ' ') :
        h(TransactionIcon, { txParams, transaction, isTx, isMsg }),
      ]),

      h('.flex-column', [
        domainField(txParams),
        h('div', date),
        recipientField(txParams, transaction, isTx, isMsg),
      ]),

      isTx ? h(EtherBalance, {
        value: txParams.value,
      }) : h('.flex-column'),
    ])
  )
}

function domainField(txParams) {
  return h('div', {
    style: {
      fontSize: 'small',
      color: '#ABA9AA',
    },
  },[
    txParams.origin,
  ])
}

function recipientField(txParams, transaction, isTx, isMsg) {
  let message

  if (isMsg) {
    message = 'Signature Requested'
  } else if (txParams.to) {
    message =  addressSummary(txParams.to)
  } else {
    message = 'Contract Published'
  }

  return h('div', {
    style: {
      fontSize: 'small',
      color: '#ABA9AA',
    },
  },[
    message,
    failIfFailed(transaction),
  ])

}

TransactionListItem.prototype.renderMessage = function() {
  const { transaction, i } = this.props
  return h('div', 'wowie, thats a message')
}

function formatDate(date){
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}

function failIfFailed(transaction) {
  if (transaction.status === 'rejected') {
    return h('span.error', ' (Rejected)')
  }
  if (transaction.status === 'failed') {
    return h('span.error', ' (Failed)')
  }
}
