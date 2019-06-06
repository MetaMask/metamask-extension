const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect

const EthBalance = require('./eth-balance')
const addressSummary = require('../util').addressSummary
const CopyButton = require('./copy/copy-button')
const vreme = new (require('vreme'))()
const Tooltip = require('./tooltip')
const numberToBN = require('number-to-bn')
const actions = require('../../../ui/app/actions')
const ethNetProps = require('eth-net-props')

const TransactionIcon = require('./transaction-list-item-icon')
const ShiftListItem = require('./shift-list-item')

const { POA_CODE,
  DAI_CODE,
  POA_SOKOL_CODE,
  MAINNET_CODE,
  ROPSTEN_CODE,
  RINKEBY_CODE,
  KOVAN_CODE,
  GOERLI_TESTNET_CODE,
  CLASSIC_CODE,
  RSK_CODE,
} = require('../../../app/scripts/controllers/network/enums')

const mapDispatchToProps = dispatch => {
  return {
    retryTransaction: transactionId => dispatch(actions.retryTransaction(transactionId)),
  }
}

module.exports = connect(null, mapDispatchToProps)(TransactionListItem)

inherits(TransactionListItem, Component)
function TransactionListItem () {
  Component.call(this)
}

TransactionListItem.prototype.showRetryButton = function () {
  const { transaction = {}, transactions } = this.props
  const { submittedTime, txParams } = transaction

  if (!txParams) {
    return false
  }

  let currentTxSharesEarliestNonce = false
  const currentNonce = txParams.nonce
  const currentNonceTxs = transactions.filter(tx => tx.txParams.nonce === currentNonce)
  const currentNonceSubmittedTxs = currentNonceTxs.filter(tx => tx.status === 'submitted')
  const currentSubmittedTxs = transactions.filter(tx => tx.status === 'submitted')
  const lastSubmittedTxWithCurrentNonce = currentNonceSubmittedTxs[0]
  const currentTxIsLatestWithNonce = lastSubmittedTxWithCurrentNonce &&
    lastSubmittedTxWithCurrentNonce.id === transaction.id
  if (currentSubmittedTxs.length > 0) {
    const earliestSubmitted = currentSubmittedTxs.reduce((tx1, tx2) => {
      if (tx1.submittedTime < tx2.submittedTime) return tx1
      return tx2
    })
    currentTxSharesEarliestNonce = currentNonce === earliestSubmitted.txParams.nonce
  }

  return currentTxSharesEarliestNonce && currentTxIsLatestWithNonce && Date.now() - submittedTime > 30000
}

TransactionListItem.prototype.render = function () {
  const { transaction, network, conversionRate, currentCurrency } = this.props
  const { status } = transaction
  if (transaction.key === 'shapeshift') {
    if (Number(network) === MAINNET_CODE) return h(ShiftListItem, transaction)
  }
  var date = formatDate(transaction.time)

  let isLinkable = false
  const numericNet = isNaN(network) ? network : parseInt(network)
  isLinkable = numericNet === MAINNET_CODE ||
    numericNet === ROPSTEN_CODE ||
    numericNet === RINKEBY_CODE ||
    numericNet === KOVAN_CODE ||
    numericNet === POA_SOKOL_CODE ||
    numericNet === POA_CODE ||
    numericNet === DAI_CODE ||
    numericNet === GOERLI_TESTNET_CODE ||
    numericNet === CLASSIC_CODE ||
    numericNet === RSK_CODE

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
  const valueStyle = {
    fontFamily: 'Nunito Bold',
    width: '100%',
    textAlign: 'right',
    fontSize: '14px',
    color: '#333333',
  }

  const dimStyle = {
    fontFamily: 'Nunito Regular',
    color: '#333333',
    marginLeft: '5px',
    fontSize: '14px',
  }
  return (
    h('.transaction-list-item.flex-column', {
      onClick: (event) => {
        if (isPending) {
          this.props.showTx(transaction.id)
        }
        event.stopPropagation()
        if (!transaction.hash || !isLinkable) return
        const url = ethNetProps.explorerLinks.getExplorerTxLinkFor(transaction.hash, numericNet)
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
              fontFamily: 'Nunito Bold',
              display: 'flex',
              cursor: 'normal',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px',
            },
          }, nonce),
        ]),

        h('.flex-column', {
          style: {
            textAlign: 'left',
          },
        }, [
          domainField(txParams),
          h('div.flex-row', [
            recipientField(txParams, transaction, isTx, isMsg),
          ]),
          h('div', {
            style: {
              fontSize: '12px',
              color: '#777777',
            },
          }, date),
        ]),

        isTx ? h(EthBalance, {
          valueStyle,
          dimStyle,
          value: txParams.value,
          conversionRate,
          currentCurrency,
          width: '55px',
          shorten: true,
          showFiat: false,
          network,
          style: {
            margin: '0px auto 0px 5px',
          },
        }) : h('.flex-column'),
      ]),

      this.showRetryButton() && h('.transition-list-item__retry.grow-on-hover.error', {
        onClick: event => {
          event.stopPropagation()
          this.resubmit()
        },
        style: {
          height: '22px',
          display: 'flex',
          alignItems: 'center',
          fontSize: '8px',
          cursor: 'pointer',
          width: 'auto',
          backgroundPosition: '10px center',
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
  this.props.retryTransaction(transaction.id)
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
    message = 'Contract Deployment'
  }

  return h('div', {
    style: {
      fontSize: '14px',
      color: '#333333',
    },
  }, [
    h('span', (!txParams.to ? {style: {whiteSpace: 'nowrap'}} : null), message),
    // Places a copy button if tx is successful, else places a placeholder empty div.
    transaction.hash ? h(CopyButton, { value: transaction.hash, display: 'inline' }) : h('div', {style: { display: 'flex', alignItems: 'center', width: '26px' }}),
    renderErrorOrWarning(transaction),
  ])
}

function formatDate (date) {
  return vreme.format(new Date(date), 'March 16 2014 14:30')
}

function renderErrorOrWarning (transaction) {
  const { status, err, warning } = transaction

  // show dropped
  if (status === 'dropped') {
    return h('div', ' (Dropped)')
  }

  // show rejected
  if (status === 'rejected') {
    return h('div', ' (Rejected)')
  }

  // show error
  if (err) {
    const message = err.message || ''
    return (
        h(Tooltip, {
          title: message,
          position: 'bottom',
        }, [
          h(`div`, ` (Failed)`),
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
      h(`div`, ` (Warning)`),
    ])
  }
}
