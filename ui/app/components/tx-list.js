const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const inherits = require('util').inherits
const selectors = require('../selectors')
const Identicon = require('./identicon')

const valuesFor = require('../util').valuesFor

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

  const { txsToRender, conversionRate } = this.props

  console.log('transactions to render', txsToRender)

  return h('div.flex-column.tx-list-container', {}, [

    h('div.flex-row.tx-list-header-wrapper', {
      style: {},
    }, [

      h('div.flex-row.tx-list-header', {
      }, [

        h('div', {
          style: {}
        }, 'TRANSACTIONS'),

      ]),

    ]),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

  ])
}

TxList.prototype.renderTransactionListItem = function () {
  // fake data
  const props = {
    dateString: 'Jul 01, 2017',
    address: '0x82df11beb942beeed58d466fcb0f0791365c7684',
    transactionStatus: 'Confirmed',
    transactionAmount: '+ 3 ETH'
  }

  const { address, transactionStatus, transactionAmount, dateString } = props

  return h('div.flex-column.tx-list-item-wrapper', {
    style: {}
  }, [

    h('div.tx-list-date-wrapper', {
      style: {}
    }, [
      h('span.tx-list-date', {}, [
        dateString,
      ])
    ]),

    h('div.flex-row.tx-list-content-wrapper', {
      style: {}
    }, [

      h('div.tx-list-identicon-wrapper', {
        style: {}
      }, [
        h(Identicon, {
          address,
          diameter: 24,
        })
      ]),

      h('div.tx-list-account-and-status-wrapper', {}, [
        h('div.tx-list-account-wrapper', {
          style: {}
        }, [
          h('span.tx-list-account', {}, [
            '0x82df11be...7684', //address
          ]),
        ]),

        h('div.tx-list-status-wrapper', {
          style: {}
        }, [
          h('span.tx-list-status', {}, [
            transactionStatus,
          ]),
        ]),
      ]),

      h('div.flex-column.tx-list-details-wrapper', {
        style: {}
      }, [

        h('span.tx-list-value', {}, [
          transactionAmount,
        ]),

        h('span.tx-list-fiat-value', {}, [
          '+ $300 USD',
        ]),

      ]),
    ])
  ])
}

