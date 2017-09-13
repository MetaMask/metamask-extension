const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const USDFeeDisplay = require('./usd-fee-display')
const EthFeeDisplay = require('./eth-fee-display')
const { getTxFeeBn, formatBalance, shortenBalance } = require('../../util')

module.exports = GasFeeDisplay

inherits(GasFeeDisplay, Component)
function GasFeeDisplay () {
  Component.call(this)
}

GasFeeDisplay.prototype.getTokenValue = function () {
  const {
    tokenExchangeRate,
    gas,
    gasPrice,
    blockGasLimit,
  } = this.props

  const value = formatBalance(getTxFeeBn(gas, gasPrice, blockGasLimit), 6, true)
  const [ethNumber] = value.split(' ')

  return shortenBalance(Number(ethNumber) / tokenExchangeRate, 6)
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
      return h('div.token-gas', [
        h('div.token-gas__amount', this.getTokenValue()),
        h('div.token-gas__symbol', currentCurrency),
      ])
  }
}

