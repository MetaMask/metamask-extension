const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../util').formatBalance

module.exports = FiatValue

inherits(FiatValue, Component)
function FiatValue () {
  Component.call(this)
}

FiatValue.prototype.render = function () {
  const props = this.props
  let { conversionRate } = props
  const { currentCurrency, network } = props
  const isSokol = parseInt(network) === 77
  if (isSokol) {
    conversionRate = 0
  }
  const renderedCurrency = currentCurrency || ''

  const value = formatBalance(props.value, 6, undefined, props.network)

  if (value === 'None') return value
  var fiatDisplayNumber, fiatTooltipNumber
  var splitBalance = value.split(' ')

  fiatTooltipNumber = Number(splitBalance[0]) * conversionRate
  fiatDisplayNumber = fiatTooltipNumber.toFixed(2)

  return fiatDisplay(fiatDisplayNumber, renderedCurrency.toUpperCase())
}

function fiatDisplay (fiatDisplayNumber, fiatSuffix) {
  if (fiatDisplayNumber !== 'N/A') {
    return h('.flex-row', {
      style: {
        alignItems: 'flex-end',
        lineHeight: '13px',
        fontFamily: 'Nunito Light',
        textRendering: 'geometricPrecision',
      },
    }, [
      h('div', {
        style: {
          width: '100%',
          textAlign: 'right',
          fontSize: '12px',
          color: '#333333',
        },
      }, fiatDisplayNumber),
      h('div', {
        style: {
          color: '#AEAEAE',
          marginLeft: '5px',
          fontSize: '12px',
        },
      }, fiatSuffix),
    ])
  } else {
    return h('div')
  }
}
