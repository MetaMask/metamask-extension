const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const parseBalance = require('../util').parseBalance

module.exports = EthBalanceComponent

inherits(EthBalanceComponent, Component)
function EthBalanceComponent() {
  Component.call(this)
}

EthBalanceComponent.prototype.render = function() {
  var state = this.props
  var parsedAmount = parseBalance(state.value)
  var beforeDecimal = parsedAmount[0]
  var afterDecimal = parsedAmount[1]
  var value = beforeDecimal+(afterDecimal ? '.'+afterDecimal : '')
  var style = state.style

  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
        },
      }, value),
      h('.ether-balance-label', {
        style: {
          display: 'inline',
          marginLeft: 6,
        },
      }, 'ETH'),
    ])

  )
}
