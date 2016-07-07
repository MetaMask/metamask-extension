const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../util').formatBalance

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

  var balance = value.split(' ')[0]
  var label = value.split(' ')[1]
  var tagName = props.inline ? 'span' : 'div'
  var topTag = props.inline ? 'div' : '.flex-column'

  return (
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
      }, label),
    ])
  )
}
