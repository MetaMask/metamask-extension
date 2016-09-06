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
  var style = props.style
  var needsParse = this.props.needsParse !== undefined ? this.props.needsParse : true
  const value = formatBalance(props.value, 6, needsParse)
  var width = props.width

  return (

    h('.ether-balance.ether-balance-amount', {
      style: style,
    }, [
      h('div', {
        style: {
          display: 'inline',
          width: width,
        },
      }, this.renderBalance(value)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value) {
  var props = this.props
  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value, props.shorten ? 1 : 3)
  var balance
  var splitBalance = value.split(' ')
  var ethNumber = splitBalance[0]
  var ethSuffix = splitBalance[1]
  const showFiat = 'showFiat' in props ? props.showFiat : true

  if (props.shorten) {
    balance = balanceObj.shortBalance
  } else {
    balance = balanceObj.balance
  }

  var label = balanceObj.label

  return (
    h(Tooltip, {
      position: 'bottom',
      title: `${ethNumber} ${ethSuffix}`,
    }, [
      h('.flex-column', {
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
          },
        }, this.props.incoming ? `+${balance}` : balance),
        h('div', {
          style: {
            color: ' #AEAEAE',
            fontSize: '12px',
          },
        }, label),
      ]),

      showFiat ? h(FiatValue, { value: props.value }) : null,
    ])
  )
}
