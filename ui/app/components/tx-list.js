const Component = require('react').Component
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const prefixForNetwork = require('../../lib/etherscan-prefix-for-network')
const selectors = require('../selectors')
const TxListItem = require('./tx-list-item')
const ShiftListItem = require('./shift-list-item')
const { formatDate } = require('../util')
const { showConfTxPage } = require('../actions')
const classnames = require('classnames')
const { tokenInfoGetter } = require('../token-util')

TxList.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(TxList)


function mapStateToProps (state) {
  return {
    txsToRender: selectors.transactionsSelector(state),
    conversionRate: selectors.conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showConfTxPage: ({ id }) => dispatch(showConfTxPage({ id })),
  }
}

inherits(TxList, Component)
function TxList () {
  Component.call(this)
}

TxList.prototype.componentWillMount = function () {
  this.tokenInfoGetter = tokenInfoGetter()
}

TxList.prototype.render = function () {
  return h('div.flex-column', [
    h('div.flex-row.tx-list-header-wrapper', [
      h('div.flex-row.tx-list-header', [
        h('div', this.context.t('transactions')),
      ]),
    ]),
    h('div.flex-column.tx-list-container', {}, [
      this.renderTransaction(),
    ]),
  ])
}

TxList.prototype.renderTransaction = function () {
  const { txsToRender, conversionRate } = this.props

  return txsToRender.length
    ? txsToRender.map((transaction, i) => this.renderTransactionListItem(transaction, conversionRate, i))
    : [h(
        'div.tx-list-item.tx-list-item--empty',
        { key: 'tx-list-none' },
        [ this.context.t('noTransactions') ],
      )]
}

// TODO: Consider moving TxListItem into a separate component
TxList.prototype.renderTransactionListItem = function (transaction, conversionRate, index) {
  // console.log({transaction})
  // refer to transaction-list.js:line 58

  if (transaction.key === 'shapeshift') {
    return h(ShiftListItem, { ...transaction, key: `shapeshift${index}` })
  }

  const props = {
    dateString: formatDate(transaction.time),
    address: transaction.txParams && transaction.txParams.to,
    transactionStatus: transaction.status,
    transactionAmount: transaction.txParams && transaction.txParams.value,
    transactionId: transaction.id,
    transactionHash: transaction.hash,
    transactionNetworkId: transaction.metamaskNetworkId,
    transactionSubmittedTime: transaction.submittedTime,
  }

  const {
    address,
    transactionStatus,
    transactionAmount,
    dateString,
    transactionId,
    transactionHash,
    transactionNetworkId,
    transactionSubmittedTime,
  } = props
  const { showConfTxPage } = this.props

  const opts = {
    key: transactionId || transactionHash,
    txParams: transaction.txParams,
    isMsg: Boolean(transaction.msgParams),
    transactionStatus,
    transactionId,
    dateString,
    address,
    transactionAmount,
    transactionHash,
    conversionRate,
    tokenInfoGetter: this.tokenInfoGetter,
    transactionSubmittedTime,
  }

  const isUnapproved = transactionStatus === 'unapproved'

  if (isUnapproved) {
    opts.onClick = () => showConfTxPage({ id: transactionId })
    opts.transactionStatus = this.context.t('notStarted')
  } else if (transactionHash) {
    opts.onClick = () => this.view(transactionHash, transactionNetworkId)
  }

  opts.className = classnames('.tx-list-item', {
    '.tx-list-pending-item-container': isUnapproved,
    '.tx-list-clickable': Boolean(transactionHash) || isUnapproved,
  })

  return h(TxListItem, opts)
}

TxList.prototype.view = function (txHash, network) {
  const url = etherscanLinkFor(txHash, network)
  if (url) {
    navigateTo(url)
  }
}

function navigateTo (url) {
  global.platform.openWindow({ url })
}

function etherscanLinkFor (txHash, network) {
  return `https://akroma.io/explorer/transaction/${txHash}`
}
