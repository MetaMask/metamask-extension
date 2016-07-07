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
  var props = this.props
  var style = props.style

  const value = formatBalance(props.value)

  return (

    h('.ether-balance', {
      style: style,
    }, [
      h('.ether-balance-amount', {
        style: {
          display: 'inline',
        },
      }, this.renderBalance(value)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value) {
  const props = this.props
  if (value === 'None') return value
  var balanceObj = generateBalanceObject(value)
  var balance = balanceObj.balance
  var label = balanceObj.label
  var tagName = props.inline ? 'span' : 'div'
  var topTag = props.inline ? 'div' : '.flex-column'

  return (

    h(Tooltip, {
      position: 'bottom',
      title: value.split(' ')[0],
    }, [
      h(topTag, {
        style: {
          alignItems: 'flex-end',
          lineHeight: props.fontSize || '13px',
          fontFamily: 'Montserrat Regular',
          textRendering: 'geometricPrecision',
        },
      }, [
        h(tagName, {
          style: {
            fontSize: props.fontSize || '12px',
          },
        }, balance + ' '),
        h(tagName, {
          style: {
            color: props.labelColor || '#AEAEAE',
            fontSize: props.fontSize || '12px',
          },
        }, [
          h('div', balance),
          h('div', {
            style: {
              color: '#AEAEAE',
              fontSize: '12px',
            },
          }, label),
        ]),
      ])
    ])

  )
}
