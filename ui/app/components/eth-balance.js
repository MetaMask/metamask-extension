const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../util').formatBalance

module.exports = EthBalanceComponent

inherits(EthBalanceComponent, Component)
function EthBalanceComponent () {
  Component.call(this)
}

EthBalanceComponent.prototype.render = function () {
  var state = this.props
  var style = state.style
  var value = formatBalance(state.value)

  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
        },
      }, this.renderBalance(value)),
    ])

  )
}

EthBalanceComponent.prototype.renderBalance = function (value) {

  if (value === 'None') return value

  var balance = value[0]
  var label = value[1]

  return (
    h('.flex-column',[
      h('div', balance),
      h('div', label)
    ])
  )

}
