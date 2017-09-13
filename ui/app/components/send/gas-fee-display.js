const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const USDFeeDisplay = require('./usd-fee-display')
const EthFeeDisplay = require('./eth-fee-display')

module.exports = GasFeeDisplay

inherits(GasFeeDisplay, Component)
function GasFeeDisplay () {
  Component.call(this)
}

GasFeeDisplay.prototype.render = function () {
  const {
    currentCurrency,
    conversionRate,
    gas,
    gasPrice,
    blockGasLimit,
  } = this.props

  switch (currentCurrency) {
    case 'USD':
      return h(USDFeeDisplay, {
        currentCurrency,
        conversionRate,
        gas,
        gasPrice,
        blockGasLimit,
      })
    case 'ETH':
      return h(EthFeeDisplay, {
        currentCurrency,
        conversionRate,
        gas,
        gasPrice,
        blockGasLimit,
      })
    default:
      return h('noscript')
  }
}

