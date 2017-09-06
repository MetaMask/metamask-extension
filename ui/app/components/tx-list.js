const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const selectors = require('../selectors')
const Identicon = require('./identicon')
const { formatBalance, formatDate } = require('../util')

module.exports = connect(mapStateToProps)(TxList)

function mapStateToProps (state) {
  return {
    txsToRender: selectors.transactionsSelector(state),
    conversionRate: selectors.conversionRateSelector(state),
  }
}

inherits(TxList, Component)
function TxList () {
  Component.call(this)
}

const contentDivider = h('div.tx-list-content-divider', {
  style: {},
})

TxList.prototype.render = function () {

  const { txsToRender } = this.props

  console.log('transactions to render', txsToRender)

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

    contentDivider,

    txsToRender.map((transaction) => {
      return this.renderTransactionListItem(transaction)
    }),

  ])
}

// TODO: Consider moving TxListItem into a separate component
TxList.prototype.renderTransactionListItem = function (transaction) {
  const props = {
    dateString: formatDate(transaction.time),
    address: transaction.txParams.to,
    transactionStatus: transaction.status,
    transactionAmount: formatBalance(transaction.txParams.value, 6),
  }
  const {
    address,
    transactionStatus,
    transactionAmount,
    dateString,
  } = props

  if (!address) return null

  return h('div', {
    key: transaction.id,
  }, [
    h('div.flex-column.tx-list-item-wrapper', {
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
              `${address.slice(0, 10)}...${address.slice(-4)}`,
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
    contentDivider,

  ])
}

