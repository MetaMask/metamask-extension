const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const EthBalance = require('../eth-balance')
const { getTxFeeBn } = require('../../util')

module.exports = EthFeeDisplay

inherits(EthFeeDisplay, Component)
function EthFeeDisplay () {
  Component.call(this)
}

EthFeeDisplay.prototype.render = function () {
  const {
    currentCurrency,
    conversionRate,
    gas,
    gasPrice,
    blockGasLimit,
  } = this.props

  return h(EthBalance, {
    value: getTxFeeBn(gas, gasPrice, blockGasLimit),
    currentCurrency,
    conversionRate,
    showFiat: false,
    hideTooltip: true,
    styleOveride: {
      color: '#5d5d5d',
      fontSize: '16px',
      fontFamily: 'DIN OT',
      lineHeight: '22.4px',
    },
  })
}

