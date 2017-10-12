const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const CurrencyDisplay = require('./currency-display');

const { multiplyCurrencies } = require('../../conversion-util')

module.exports = GasFeeDisplay

inherits(GasFeeDisplay, Component)
function GasFeeDisplay () {
  Component.call(this)
}

GasFeeDisplay.prototype.render = function () {
  const {
    conversionRate,
    gasLimit,
    gasPrice,
    onClick,
  } = this.props

  const readyToRender = Boolean(gasLimit && gasPrice)

  return h('div', [

    readyToRender
      ? h(CurrencyDisplay, {
        primaryCurrency: 'ETH',
        convertedCurrency: 'USD',
        value: multiplyCurrencies(gasLimit, gasPrice, {
          toNumericBase: 'hex',
          multiplicandBase: 16,
          multiplierBase: 16,
        }),
        conversionRate,
        convertedPrefix: '$',
        readOnly: true,
      })
      : h('div.currency-display', 'Loading...')
    ,

    h('div.send-v2__sliders-icon-container', {
      onClick,
    }, [
      h('i.fa.fa-sliders.send-v2__sliders-icon'),
    ])

  ])
}

