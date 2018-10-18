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
  const isDai = parseInt(network) === 100
  if (isSokol) {
    conversionRate = 0
  } else if (isDai) {
    conversionRate = 1
  }
  const renderedCurrency = currentCurrency || ''

  const value = formatBalance(props.value, 6, undefined, props.network)

  if (value === 'None') return value
  var fiatDisplayNumber, fiatTooltipNumber
  var splitBalance = value.split(' ')

  fiatTooltipNumber = Number(splitBalance[0]) * conversionRate
  fiatDisplayNumber = fiatTooltipNumber.toFixed(2)

  const valueStyle = props.valueStyle ? props.valueStyle : {
    width: '100%',
    textAlign: 'right',
    fontSize: '14px',
    color: '#ffffff',
  }

  const dimStyle = props.dimStyle ? props.dimStyle : {
    color: '#60db97',
    marginLeft: '5px',
    fontSize: '14px',
  }

  return fiatDisplay(fiatDisplayNumber, valueStyle, dimStyle, renderedCurrency.toUpperCase())
}

function fiatDisplay (fiatDisplayNumber, valueStyle, dimStyle, fiatSuffix) {

  if (fiatDisplayNumber !== 'N/A') {
    return h('.flex-row', {
      style: {
        alignItems: 'flex-end',
        lineHeight: '14px',
        textRendering: 'geometricPrecision',
      },
    }, [
      h('div', {
        style: valueStyle,
      }, fiatDisplayNumber),
      h('div', {
        style: dimStyle,
      }, fiatSuffix),
    ])
  } else {
    return h('div')
  }
}
