const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../util').formatBalance
const generateBalanceObject = require('../util').generateBalanceObject
const Tooltip = require('./tooltip.js')
module.exports = EthBalanceComponent

inherits(EthBalanceComponent, Component)
function EthBalanceComponent () {
  Component.call(this)
}

EthBalanceComponent.prototype.render = function () {
  var state = this.props
  var style = state.style

  const value = formatBalance(state.value, 6)
  var width = state.width

  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
          width: width,
        },
      }, this.renderBalance(value, state)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value, state) {
  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value, 1)
  var balance

  if (state.shorten) {
    balance = balanceObj.shortBalance
  } else {
    balance = balanceObj.balance
  }

  var label = balanceObj.label

  return (
    h(Tooltip, {
      position: 'bottom',
      title: value.split(' ')[0],
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
        }, balance),
        h('div', {
          style: {
            color: ' #AEAEAE',
            fontSize: '12px',
          },
        }, label),
      ]),
    ])
  )
}
