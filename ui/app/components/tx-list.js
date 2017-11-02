const Component = require('react').Component
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
  return h('div.flex-column.tx-list-container', {}, [

    h('div.flex-row.tx-list-header-wrapper', [
      h('div.flex-row.tx-list-header', [
        h('div', 'transactions'),
      ]),
    ]),

    this.renderTransaction(),

  ])
}

TxList.prototype.renderTransaction = function () {
  const { txsToRender, conversionRate } = this.props
  return txsToRender.length
    ? txsToRender.map((transaction, i) => this.renderTransactionListItem(transaction, conversionRate))
    : [h(
        'div.tx-list-item.tx-list-item--empty',
        { key: 'tx-list-none' },
        [ 'No Transactions' ],
      )]
}

// TODO: Consider moving TxListItem into a separate component
TxList.prototype.renderTransactionListItem = function (transaction, conversionRate) {
  // console.log({transaction})
  // refer to transaction-list.js:line 58

  if (transaction.key === 'shapeshift') {
    return h(ShiftListItem, transaction)
  }

  const props = {
    dateString: formatDate(transaction.time),
    address: transaction.txParams.to,
    transactionStatus: transaction.status,
    transactionAmount: transaction.txParams.value,
    transActionId: transaction.id,
    transactionHash: transaction.hash,
    transactionNetworkId: transaction.metamaskNetworkId,
  }

  const {
    address,
    transactionStatus,
    transactionAmount,
    dateString,
    transActionId,
    transactionHash,
    transactionNetworkId,
  } = props
  const { showConfTxPage } = this.props

  const opts = {
    key: transActionId || transactionHash,
    txParams: transaction.txParams,
    transactionStatus,
    transActionId,
    dateString,
    address,
    transactionAmount,
    transactionHash,
    conversionRate,
    tokenInfoGetter: this.tokenInfoGetter,
  }

  const isUnapproved = transactionStatus === 'unapproved'

  if (isUnapproved) {
    opts.onClick = () => showConfTxPage({id: transActionId})
    opts.transactionStatus = 'Not Started'
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
  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/tx/${txHash}`
}
