const { Component } = require('react')
const h = require('react-hyperscript')
const connect = require('react-redux').connect
const { inherits } = require('util')
const {
  formatBalance,
  generateBalanceObject,
} = require('../../helpers/utils/util')
const Tooltip = require('./tooltip.js')
const FiatValue = require('./fiat-value.js')

module.exports = connect(mapStateToProps)(EthBalanceComponent)
function mapStateToProps (state) {
  return {
    ticker: state.metamask.ticker,
  }
}

inherits(EthBalanceComponent, Component)
function EthBalanceComponent () {
  Component.call(this)
}

EthBalanceComponent.prototype.render = function () {
  const props = this.props
  const { ticker, value, style, width, needsParse = true } = props

  const formattedValue = value ? formatBalance(value, 6, needsParse, ticker) : '...'

  return (

    h('.ether-balance.ether-balance-amount', {
      style,
    }, [
      h('div', {
        style: {
          display: 'inline',
          width,
        },
      }, this.renderBalance(formattedValue)),
    ])

  )
}
EthBalanceComponent.prototype.renderBalance = function (value) {
  if (value === 'None') return value
  if (value === '...') return value

  const {
    conversionRate,
    shorten,
    incoming,
    currentCurrency,
    hideTooltip,
    styleOveride = {},
    showFiat = true,
  } = this.props
  const { fontSize, color, fontFamily, lineHeight } = styleOveride

  const { shortBalance, balance, label } = generateBalanceObject(value, shorten ? 1 : 3)
  const balanceToRender = shorten ? shortBalance : balance

  const [ethNumber, ethSuffix] = value.split(' ')
  const containerProps = hideTooltip ? {} : {
    position: 'bottom',
    title: `${ethNumber} ${ethSuffix}`,
  }

  return (
    h(hideTooltip ? 'div' : Tooltip,
      containerProps,
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
          }, incoming ? `+${balanceToRender}` : balanceToRender),
          h('div', {
            style: {
              color: color || '#AEAEAE',
              fontSize: fontSize || '12px',
              marginLeft: '5px',
            },
          }, label),
        ]),

        showFiat ? h(FiatValue, { value: this.props.value, conversionRate, currentCurrency }) : null,
      ])
    )
  )
}
