const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const selectors = require('../selectors')
const TxListItem = require('./tx-list-item')
const { formatBalance, formatDate } = require('../util')
const { showConfTxPage } = require('../actions')

module.exports = connect(mapStateToProps, mapDispatchToProps)(TxList)

function mapStateToProps (state) {
  return {
    txsToRender: selectors.transactionsSelector(state),
    conversionRate: selectors.conversionRateSelector(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    showConfTxPage: ({ id }) => dispatch(showConfTxPage({ id }))
  }
}

inherits(TxList, Component)
function TxList () {
  Component.call(this)
}

TxList.prototype.render = function () {

  const { txsToRender, showConfTxPage } = this.props

  return h('div.flex-column.tx-list-container', {}, [

    h('div.flex-row.tx-list-header-wrapper', {
      style: {},
    }, [

      h('div.flex-row.tx-list-header', {
      }, [

        h('div', {
          style: {},
        }, 'transactions'),

      ]),

    ]),

    this.renderTranstions(),

  ])
}

TxList.prototype.renderTranstions = function () {
  const { txsToRender } = this.props

  return txsToRender.length
    ? txsToRender.map((transaction) => {
      return this.renderTransactionListItem(transaction)
    })
    : h('div.tx-list-item.tx-list-item--empty', [ 'No Transactions' ])
}

// TODO: Consider moving TxListItem into a separate component
TxList.prototype.renderTransactionListItem = function (transaction) {
  const props = {
    dateString: formatDate(transaction.time),
    address: transaction.txParams.to,
    transactionStatus: transaction.status,
    transactionAmount: formatBalance(transaction.txParams.value, 6),
    transActionId: transaction.id,
  }

  const {
    address,
    transactionStatus,
    transactionAmount,
    dateString,
    transActionId,
  } = props
  const { showConfTxPage } = this.props

  if (!address) return null
    
  const opts = {
    transactionStatus,
    transActionId,
    dateString,
    address,
    transactionAmount,
  }

  if (transactionStatus === 'unapproved') {
    opts.onClick = () => showConfTxPage({id: transActionId})
    opts.className = '.tx-list-pending-item-container'
  }

  return h(TxListItem, opts)
}

