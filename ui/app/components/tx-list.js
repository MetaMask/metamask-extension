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
const { showConfTxPage, updateNetworkNonce } = require('../actions')
const classnames = require('classnames')
const { tokenInfoGetter } = require('../token-util')
const { withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const { CONFIRM_TRANSACTION_ROUTE } = require('../routes')

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(TxList)

TxList.contextTypes = {
  t: PropTypes.func,
}

function mapStateToProps (state) {
  return {
    txsToRender: selectors.transactionsSelector(state),
    conversionRate: selectors.conversionRateSelector(state),
    selectedAddress: selectors.getSelectedAddress(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showConfTxPage: ({ id }) => dispatch(showConfTxPage({ id })),
    updateNetworkNonce: (address) => dispatch(updateNetworkNonce(address)),
  }
}

inherits(TxList, Component)
function TxList () {
  Component.call(this)
}

TxList.prototype.componentWillMount = function () {
  this.tokenInfoGetter = tokenInfoGetter()
  this.props.updateNetworkNonce(this.props.selectedAddress)
}

TxList.prototype.componentDidUpdate = function (prevProps) {
  const oldTxsToRender = prevProps.txsToRender
  const {
    txsToRender: newTxsToRender,
    selectedAddress,
    updateNetworkNonce,
  } = this.props

  if (newTxsToRender.length > oldTxsToRender.length) {
    updateNetworkNonce(selectedAddress)
  }
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
  const { history } = this.props

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
    opts.onClick = () => {
      this.props.showConfTxPage({ id: transactionId })
      history.push(CONFIRM_TRANSACTION_ROUTE)
    }
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
  const prefix = prefixForNetwork(network)
  return `https://${prefix}etherscan.io/tx/${txHash}`
}
