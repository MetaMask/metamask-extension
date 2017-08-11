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

const contentDivider = h('div', {
  style: {
    marginLeft: '1.3em',
    marginRight: '1.3em',
    height:'1px',
    background:'#E7E7E7', // TODO: make custom color
  },
})

TxList.prototype.render = function () {

  const { txsToRender, conversionRate } = this.props

  console.log('transactions to render', txsToRender)

  return h('div.flex-column.tx-list-container', {}, [

    h('div.flex-row.tx-list', {
      style: {
        margin: '1.8em 0.9em 0.8em 0.9em',
      },
    }, [

      // tx-view-tab.js
      h('div.flex-row', {
      }, [

        h('div', {
          style: {}
        }, 'TRANSACTIONS'),

      ]),
    ]),

    contentDivider,

    this.renderTransactionListItem(),

    contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

    // this.renderTransactionListItem(),

    // contentDivider,

  ])
}

TxList.prototype.renderTransactionListItem = function () {
  // fake data
  const props = {
    dateString: 'Jul 01, 2017',
    address: '0x82df11beb942beeed58d466fcb0f0791365c7684',
    transactionStatus: 'Confirmed',
    transactionAmount: '3'
  }

  const { address, transactionStatus, transactionAmount, dateString } = props

  return h('div.flex-column', {
    style: {
      alignItems: 'stretch',
      justifyContent: 'flex-start',
      margin: '0.6em 1.3em 0.6em 1.3em',
      overflow: 'none'
    }
  }, [

    h('div', {
      style: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 'auto',
        marginTop: '0.3em',
      }
    }, [
      h('span', {}, [
        dateString,
      ])
    ]),

    h('div.flex-row', {
      style: {
        alignItems: 'stretch',
      }
    }, [

      h('div', {
        style: {
          flexGrow: 1,
        }
      }, [
        h(Identicon, {
          address,
          diameter: 24,
        })
      ]),

      h('div', {
        style: {
          flexGrow: 3,
        }
      }, [
        h('span', {}, [
          '0x82df11be...7684', //address
        ]),
      ]),

      h('div', {
        style: {
          flexGrow: 5,
        }
      }, [
        h('span', {}, [
          transactionStatus,
        ]),
      ]),

      h('div.flex-column', {
        style: {
          flexGrow: 2,
        }
      }, [

        h('span', {}, [
          transactionAmount,
        ]),

        h('span', {}, [
          '300 USD',
        ]),

      ]),
    ])
  ])
}

