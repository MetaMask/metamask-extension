const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const connect = require('react-redux').connect
const formatBalance = require('../util').formatBalance
const generateBalanceObject = require('../util').generateBalanceObject
const Tooltip = require('./tooltip.js')

module.exports = connect(mapStateToProps)(EthBalanceComponent)

function mapStateToProps (state) {
  return {
    conversionRate: state.metamask.conversionRate,
    conversionDate: state.metamask.conversionDate,
    currentFiat: state.metamask.currentFiat,
  }
}

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
  var balance, fiatNumber
  var splitBalance = value.split(' ')
  var ethNumber = splitBalance[0]
  var ethSuffix = splitBalance[1]


  if (state.conversionRate !== 'N/A') {
    fiatNumber = (Number(splitBalance[0]) * state.conversionRate).toFixed(2)
  } else {
    fiatNumber = 'N/A'
  }

  var fiatSuffix = state.currentFiat

  if (state.shorten) {
    balance = balanceObj.shortBalance
  } else {
    balance = balanceObj.balance
  }

  var label = balanceObj.label

  return (
    h('.flex-column', [
      h(Tooltip, {
        position: 'bottom',
        title: `${ethNumber} ${ethSuffix}`,
      }, [
        h('.flex-row', {
          style: {
            alignItems: 'flex-end',
            lineHeight: '13px',
            fontFamily: 'Montserrat Light',
            textRendering: 'geometricPrecision',
            marginBottom: '5px',
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
              color: '#AEAEAE',
              marginLeft: '5px',
            },
          }, label),
        ]),
      ]),
      h(Tooltip, {
        position: 'bottom',
        title: `${fiatNumber} ${fiatSuffix}`,
      }, [
        fiatDisplay(fiatNumber, fiatSuffix),
      ]),
    ])
  )
}

function fiatDisplay (fiatNumber, fiatSuffix) {
  if (fiatNumber !== 'N/A') {
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
      }, fiatNumber),
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
