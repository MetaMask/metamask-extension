const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const actions = require('../actions')

module.exports = connect(mapStateToProps)(BuyButtonSubview)

function mapStateToProps (state) {
  return {
    selectedAccount: state.selectedAccount,

  }
}

inherits(BuyButtonSubview, Component)
function BuyButtonSubview () {
  Component.call(this)
}

BuyButtonSubview.prototype.render = function () {
  const props = this.props
  var amount = props.accountDetail.amount
  var address = props.accountDetail.buyAddress

  return (
    h('buy-button-subview', {
      key: 'buy',
    }, [
      h('.flex-row', [
        h('div', 'Address:'),
        h('input', {
          type: 'text',
          defaultValue: address,
          onChange: this.handleChang.bind(this, 'buyAddress')
        }),
      ]),

      h('.flex-row', [
        h('div', 'amount:'),
        h('input', {
          defaultValue: amount,
          onChange: this.handleChang.bind(this, 'amount')
        }),
      ]),

      h('button', {
        onClick: () => props.dispatch(actions.buyEth(props.accountDetail.buyAddress, props.accountDetail.amount))
      }, 'Continue to Coinbase'),
      ])
  )
}

BuyButtonSubview.prototype.handleChang = function (key, event) {
  if (!event.target.value) return

  this.props.dispatch(actions.updateCoinBaseInfo(key, event.target.value))
  debugger
}

