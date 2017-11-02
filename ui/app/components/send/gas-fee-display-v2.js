const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const CurrencyDisplay = require('./currency-display')

module.exports = GasFeeDisplay

inherits(GasFeeDisplay, Component)
function GasFeeDisplay () {
  Component.call(this)
}

GasFeeDisplay.prototype.render = function () {
  const {
    conversionRate,
    gasTotal,
    onClick,
    primaryCurrency = 'ETH',
    convertedCurrency,
  } = this.props

  return h('div.send-v2__gas-fee-display', [

    gasTotal
      ? h(CurrencyDisplay, {
        primaryCurrency,
        convertedCurrency,
        value: gasTotal,
        conversionRate,
        convertedPrefix: '$',
        readOnly: true,
      })
      : h('div.currency-display', 'Loading...'),

    h('div.send-v2__sliders-icon-container', {
      onClick,
    }, [
      h('i.fa.fa-sliders.send-v2__sliders-icon'),
    ]),

  ])
}

