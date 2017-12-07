const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

const EthBalance = require('./eth-balance')
const addressSummary = require('../util').addressSummary
const explorerLink = require('etherscan-link').createExplorerLink
const CopyButton = require('./copyButton')
const vreme = new (require('vreme'))()
const Tooltip = require('./tooltip')
const numberToBN = require('number-to-bn')
const actions = require('../actions')

const TransactionIcon = require('./transaction-list-item-icon')
const ShiftListItem = require('./shift-list-item')
module.exports = TransactionListItem

inherits(TransactionListItem, Component)
function TransactionListItem () {
  Component.call(this)
}

TransactionListItem.prototype.render = function () {
  const { transaction, network, conversionRate, currentCurrency } = this.props
  const { status } = transaction
  if (transaction.key === 'shapeshift') {
    if (network === '1') return h(ShiftListItem, transaction)
  }
  var date = formatDate(transaction.time)

  let isLinkable = false
  const numericNet = parseInt(network)
  isLinkable = numericNet === 1 || numericNet === 3 || numericNet === 4 || numericNet === 42

  var isMsg = ('msgParams' in transaction)
  var isTx = ('txParams' in transaction)
  var isPending = status === 'unapproved'
  let txParams
  if (isTx) {
    txParams = transaction.txParams
  } else if (isMsg) {
    txParams = transaction.msgParams
  }

  const nonce = txParams.nonce ? numberToBN(txParams.nonce).toString(10) : ''

  const isClickable = ('hash' in transaction && isLinkable) || isPending
  return (
    h('.transaction-list-item.flex-column', {
      onClick: (event) => {
        if (isPending) {
          this.props.showTx(transaction.id)
        }
        event.stopPropagation()
        if (!transaction.hash || !isLinkable) return
        var url = explorerLink(transaction.hash, parseInt(network))
        global.platform.openWindow({ url })
      },
      style: {
        padding: '20px 0',
        alignItems: 'center',
      },
    }, [
      h(`.flex-row.flex-space-between${isClickable ? '.pointer' : ''}`, {
        style: {
          width: '100%',
        },
      }, [
        h('.identicon-wrapper.flex-column.flex-center.select-none', [
          h(TransactionIcon, { txParams, transaction, isTx, isMsg }),
        ]),

        h(Tooltip, {
          title: 'Transaction Number',
          position: 'right',
        }, [
          h('span', {
            style: {
              display: 'flex',
              cursor: 'normal',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
            },
          }, nonce),
        ]),

        h('.flex-column', {style: {width: '200px', overflow: 'hidden'}}, [
          domainField(txParams),
          h('div', date),
          recipientField(txParams, transaction, isTx, isMsg),
        ]),

        // Places a copy button if tx is successful, else places a placeholder empty div.
        transaction.hash ? h(CopyButton, { value: transaction.hash }) : h('div', {style: { display: 'flex', alignItems: 'center', width: '26px' }}),

        isTx ? h(EthBalance, {
          value: txParams.value,
          conversionRate,
          currentCurrency,
          width: '55px',
          shorten: true,
          showFiat: false,
          style: {fontSize: '15px'},
        }) : h('.flex-column'),
      ]),

      transaction.status === 'submitted' && h('.transition-list-item__retry', {
        onClick: event => {
          event.stopPropagation()
          this.resubmit()
        },
        style: {
          height: '30px',
          borderRadius: '30px',
          color: '#F9881B',
          padding: '0 25px',
          backgroundColor: '#FFE3C9',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontSize: '9px',
          cursor: 'pointer',
        },
      }, [
        h('div', {
          style: {
            paddingRight: '2px',
          },
        }, 'Taking too long?'),
        h('div', {
          style: {
            textDecoration: 'underline',
          },
        }, 'Retry with a higher gas price here'),
      ]),
    ])
  )
}

TransactionListItem.prototype.resubmit = function () {
  const { transaction } = this.props
  this.props.dispatch(actions.resubmitTx(transaction.id))
}

function domainField (txParams) {
  return h('div', {
    style: {
      fontSize: 'x-small',
      color: '#ABA9AA',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      width: '100%',
    },
  }, [
    txParams.origin,
  ])
}

function recipientField (txParams, transaction, isTx, isMsg) {
  let message

  if (isMsg) {
    message = 'Signature Requested'
  } else if (txParams.to) {
    message = addressSummary(txParams.to)
  } else {
    message = 'Contract Published'
  }

  return h('div', {
    style: {
      fontSize: 'x-small',
      color: '#ABA9AA',
    },
  }, [
    message,
    renderErrorOrWarning(transaction),
  ])
}

function formatDate (date) {
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}

function renderErrorOrWarning (transaction) {
  const { status, err, warning } = transaction

  // show rejected
  if (status === 'rejected') {
    return h('span.error', ' (Rejected)')
  }

  // show error
  if (err) {
    const message = err.message || ''
    return (
        h(Tooltip, {
          title: message,
          position: 'bottom',
        }, [
          h(`span.error`, ` (Failed)`),
        ])
    )
  }

  // show warning
  if (warning) {
    const message = warning.message
    return h(Tooltip, {
      title: message,
      position: 'bottom',
    }, [
      h(`span.warning`, ` (Warning)`),
    ])
  }
}
