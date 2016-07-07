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
  var value = formatBalance(state.value)
  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
          width: '55px',
          overflow: 'hidden',
        },
      }, this.renderBalance(value)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value) {
  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value)

  var balance = balanceObj.balance
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
            overflow: 'hidden',
            textOverflow: 'ellipsis',
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
