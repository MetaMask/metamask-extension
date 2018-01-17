const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const FiatValue = require('../fiat-value')
const { getTxFeeBn } = require('../../util')

module.exports = USDFeeDisplay

inherits(USDFeeDisplay, Component)
function USDFeeDisplay () {
  Component.call(this)
}

USDFeeDisplay.prototype.render = function () {
  const {
    activeCurrency,
    conversionRate,
    gas,
    gasPrice,
    blockGasLimit,
  } = this.props

  return h(FiatValue, {
    value: getTxFeeBn(gas, gasPrice, blockGasLimit),
    conversionRate,
    currentCurrency: activeCurrency,
    style: {
      color: '#5d5d5d',
      fontSize: '16px',
      fontFamily: 'DIN OT',
      lineHeight: '22.4px',
    },
  })
}

