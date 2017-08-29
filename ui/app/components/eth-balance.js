const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../util').formatBalance
const generateBalanceObject = require('../util').generateBalanceObject
const Tooltip = require('./tooltip.js')
const FiatValue = require('./fiat-value.js')

module.exports = EthBalanceComponent

inherits(EthBalanceComponent, Component)
function EthBalanceComponent () {
  Component.call(this)
}

EthBalanceComponent.prototype.render = function () {
  var props = this.props
  let { value } = props
  const { style, width } = props
  var needsParse = this.props.needsParse !== undefined ? this.props.needsParse : true
  value = value ? formatBalance(value, 6, needsParse) : '...'

  return (

    h('.ether-balance.ether-balance-amount', {
      style,
    }, [
      h('div', {
        style: {
          display: 'inline',
          width,
        },
      }, this.renderBalance(value)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value) {
  var props = this.props
  const {
    conversionRate,
    shorten,
    incoming,
    currentCurrency,
    hideTooltip,
    styleOveride,
  } = props

  const { fontSize, color, fontFamily, lineHeight } = styleOveride

  if (value === 'None') return value
  if (value === '...') return value
  var balanceObj = generateBalanceObject(value, shorten ? 1 : 3)
  var balance
  var splitBalance = value.split(' ')
  var ethNumber = splitBalance[0]
  var ethSuffix = splitBalance[1]
  const showFiat = 'showFiat' in props ? props.showFiat : true

  if (shorten) {
    balance = balanceObj.shortBalance
  } else {
    balance = balanceObj.balance
  }

  var label = balanceObj.label
  const tooltipProps = hideTooltip ? {} : {
    position: 'bottom',
    title: `${ethNumber} ${ethSuffix}`,
  };

  return (
    h(hideTooltip ? 'div' : Tooltip,
      tooltipProps,
      h('div.flex-column', [
        h('.flex-row', {
          style: {
            alignItems: 'flex-end',
            lineHeight: lineHeight || '13px',
            fontFamily: fontFamily || 'Montserrat Light',
            textRendering: 'geometricPrecision',
          },
        }, [
          h('div', {
            style: {
              width: '100%',
              textAlign: 'right',
              fontSize: fontSize || 'inherit',
              color: color || 'inherit',
            },
          }, incoming ? `+${balance}` : balance),
          h('div', {
            style: {
              color: color || '#AEAEAE',
              fontSize: fontSize || '12px',
              marginLeft: '5px',
            },
          }, label),
        ]),

        showFiat ? h(FiatValue, { value: props.value, conversionRate, currentCurrency }) : null,
      ]))
  )
}
