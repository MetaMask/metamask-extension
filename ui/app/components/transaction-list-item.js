const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const Identicon = require('./identicon')
const EtherBalance = require('./eth-balance')
const addressSummary = require('../util').addressSummary
const explorerLink = require('../../lib/explorer-link')
const formatBalance = require('../util').formatBalance
const vreme = new (require('vreme'))

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

  var txParams = transaction.txParams

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

TransactionListItem.prototype.renderMessage = function() {
  const { transaction, i } = this.props
  return h('div', 'wowie, thats a message')
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
