const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const formatBalance = require('../util').formatBalance
const generateBalanceObject = require('../util').generateBalanceObject
const Tooltip = require('./tooltip.js')


function mapStateToProps (state) {
  return {
    conversionRate: state.metamask.conversionRate,
    conversionDate: state.metamask.conversionDate,
    currentFiat: state.metamask.currentFiat,
  }
}

module.exports = connect(mapStateToProps)(EthBalanceComponent)


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
  var balanceObj = generateBalanceObject(value, state.shorten ? 1 : 3)
  var balance
  var splitBalance = value.split(' ')
  var ethNumber = splitBalance[0]
  var ethSuffix = splitBalance[1]
  var fiatNumber = Number(splitBalance[0]) * state.conversionRate
  var fiatSuffix = state.currentFiat

  if (state.shorten) {
    balance = balanceObj.shortBalance
  } else {
    balance = balanceObj.balance
  }

  var label = balanceObj.label

  return (
    h(Tooltip, {
      position: 'bottom',
      multiline: true,
      title: `${ethNumber} ${ethSuffix}
      ${fiatNumber} ${fiatSuffix}`,
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
