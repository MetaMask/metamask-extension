const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const EthBalance = require('../eth-balance')
const FiatValue = require('../fiat-value')
const { getTxFeeBn } = require('../../util')

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

  const renderableCurrencies = {
    USD: h(FiatValue, {
      value: getTxFeeBn(gas, gasPrice, blockGasLimit),
      conversionRate,
      currentCurrency,
      style: {
        color: '#5d5d5d',
        fontSize: '16px',
        fontFamily: 'DIN OT',
        lineHeight: '22.4px'
      }
    }),
    ETH: h(EthBalance, {
      value: getTxFeeBn(gas, gasPrice, blockGasLimit),
      currentCurrency,
      conversionRate,
      showFiat: false,
      hideTooltip: true,
      styleOveride: {
        color: '#5d5d5d',
        fontSize: '16px',
        fontFamily: 'DIN OT',
        lineHeight: '22.4px'
      }
    }),
  }

  return renderableCurrencies[currentCurrency];
}

