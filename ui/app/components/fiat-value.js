const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const formatBalance = require('../util').formatBalance
const generateBalanceObject = require('../util').generateBalanceObject
const Tooltip = require('./tooltip.js')

module.exports = connect(mapStateToProps)(FiatValue)

function mapStateToProps (state) {
  return {
    conversionRate: state.metamask.conversionRate,
    currentFiat: state.metamask.currentFiat,
  }
}

inherits(FiatValue, Component)
function FiatValue () {
  Component.call(this)
}

FiatValue.prototype.render = function () {
  const props = this.props
  const value = formatBalance(props.value, 6)

  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value, props.shorten ? 1 : 3)
  var fiatDisplayNumber, fiatTooltipNumber
  var splitBalance = value.split(' ')

  if (props.conversionRate !== 0) {
    fiatTooltipNumber = Number(splitBalance[0]) * props.conversionRate
    fiatDisplayNumber = fiatTooltipNumber.toFixed(2)
  } else {
    fiatDisplayNumber = 'N/A'
  }

  var fiatSuffix = props.currentFiat

  return (
    h(Tooltip, {
      position: 'bottom',
      title: `${fiatTooltipNumber} ${fiatSuffix}`,
    }, [
      fiatDisplay(fiatDisplayNumber, fiatSuffix),
    ])
  )
}

function fiatDisplay (fiatDisplayNumber, fiatSuffix) {
  if (fiatDisplayNumber !== 'N/A') {
    return h('.flex-row', {
      style: {
        alignItems: 'flex-end',
        lineHeight: '13px',
        fontFamily: 'Montserrat Light',
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
