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
  var maxWidth = state.maxWidth
  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
          maxWidth: maxWidth,
        },
      }, this.renderBalance(value,state)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value,state) {
  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value)

  var balance = balanceObj.balance

  if (state.shorten) {
    balance = shortenBalance(balance)
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

function shortenBalance(balance) {
  var truncatedValue
  var convertedBalance = parseFloat(balance)
  if (convertedBalance > 1000000) {
    truncatedValue = (balance/1000000).toFixed(1)
    return `${truncatedValue}m`
  } else if (convertedBalance > 1000) {
    truncatedValue = (balance/1000).toFixed(1)
    return `${truncatedValue}k`
  } else {
    return balance
  }
}
