const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const selectors = require('../selectors')
const Identicon = require('./identicon')
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

TxList.prototype.getAddressText = function (transaction) {
  const {
    txParams: { to },
  } = transaction

  return to
    ? `${to.slice(0, 10)}...${to.slice(-4)}`
    : 'Contract Published'
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

  return h('div.tx-list-item', {
    key: transaction.id,
  }, [
    h('div.flex-column.tx-list-item__wrapper', {
      onClick: () => transactionStatus === 'unapproved' && showConfTxPage({id: transActionId}),
      style: {},
    }, [

      h('div.tx-list-date-wrapper', {
        style: {},
      }, [
        h('span.tx-list-date', {}, [
          dateString,
        ]),
      ]),

      h('div.flex-row.tx-list-content-wrapper', {
        style: {},
      }, [

        h('div.tx-list-identicon-wrapper', {
          style: {},
        }, [
          h(Identicon, {
            address,
            diameter: 28,
          }),
        ]),

        h('div.tx-list-account-and-status-wrapper', {}, [
          h('div.tx-list-account-wrapper', {
            style: {},
          }, [
            h('span.tx-list-account', {}, [
              this.getAddressText(transaction),
            ]),
          ]),

          h('div.tx-list-status-wrapper', {
            style: {},
          }, [
            h('span.tx-list-status', {}, [
              transactionStatus,
            ]),
          ]),
        ]),

        h('div.flex-column.tx-list-details-wrapper', {
          style: {},
        }, [

          h('span.tx-list-value', {}, [
            transactionAmount,
          ]),

          h('span.tx-list-fiat-value', {}, [
            '+ $300 USD',
          ]),

        ]),

      ]),
    ]),

  ])
}

