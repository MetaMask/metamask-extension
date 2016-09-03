const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../util').formatBalance
const generateBalanceObject = require('../util').generateBalanceObject
const Tooltip = require('./tooltip.js')
const FiatValue = require('./fiat-value')

module.exports = EthBalanceComponent

inherits(EthBalanceComponent, Component)
function EthBalanceComponent () {
  Component.call(this)
}

EthBalanceComponent.prototype.render = function () {
  var props = this.props
  var style = props.style

  var width = props.width

  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
          width: width,
        },
      }, this.renderBalance()),
    ])
  )
}

EthBalanceComponent.prototype.renderBalance = function () {
  const props = this.props
  const value = formatBalance(props.value, 6)

  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value, props.shorten ? 1 : 3)
  var balance
  var splitBalance = value.split(' ')
  var ethNumber = splitBalance[0]
  var ethSuffix = splitBalance[1]

  if (props.shorten) {
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
      h(FiatValue, { value: props.value }),
    ])
  )
}

