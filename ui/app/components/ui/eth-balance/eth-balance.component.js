import PropTypes from 'prop-types'
import React, {Component} from 'react'

const {
  formatBalance,
  generateBalanceObject,
} = require('../../../helpers/utils/util')
const Tooltip = require('../tooltip.js')
const FiatValue = require('../fiat-value.js')

export default class EthBalance extends Component {
  static defaultProps = {
    style: null,
    styleOverride: {},
    showFiat: true,
    needsParse: true,
    width: undefined,
    shorten: false,
    incoming: false,
  }

  static propTypes = {
    conversionRate: PropTypes.any.isRequired,
    shorten: PropTypes.bool,
    incoming: PropTypes.bool,
    currentCurrency: PropTypes.string.isRequired,
    hideTooltip: PropTypes.bool,
    styleOverride: PropTypes.object,
    showFiat: PropTypes.bool,
    ticker: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    style: PropTypes.object,
    width: PropTypes.string,
    needsParse: PropTypes.bool,
  }

  renderBalance (value) {
    if (value === 'None') {
      return value
    }
    if (value === '...') {
      return value
    }

    const {
      conversionRate,
      shorten,
      incoming,
      currentCurrency,
      hideTooltip,
      styleOverride = {},
      showFiat = true,
    } = this.props
    const { fontSize, color, fontFamily, lineHeight } = styleOverride

    const { shortBalance, balance, label } = generateBalanceObject(value, shorten ? 1 : 3)
    const balanceToRender = shorten ? shortBalance : balance

    const [ethNumber, ethSuffix] = value.split(' ')
    const containerProps = hideTooltip ? {} : {
      position: 'bottom',
      title: `${ethNumber} ${ethSuffix}`,
    }

    const TooltipComponent = hideTooltip ? 'div' : Tooltip

    return (
      <TooltipComponent {...containerProps}>
        <div className="flex-column">
          <div
            className="flex-row"
            style={{
              alignItems: 'flex-end',
              lineHeight: lineHeight || '13px',
              fontFamily: fontFamily || 'Montserrat Light',
              textRendering: 'geometricPrecision',
            }}
          >
            <div
              style={{
                width: '100%',
                textAlign: 'right',
                fontSize: fontSize || 'inherit',
                color: color || 'inherit',
              }}
            >
              {
                incoming
                  ? `+${balanceToRender}`
                  : balanceToRender
              }
            </div>
            <div
              style={{
                color: color || '#AEAEAE',
                fontSize: fontSize || '12px',
                marginLeft: '5px',
              }}
            >
              {label}
            </div>
          </div>
        </div>
        {
          showFiat
            ? (
              <FiatValue
                value={this.props.value}
                conversionRate={conversionRate}
                currentCurrency={currentCurrency}
              />
            )
            : null
        }
      </TooltipComponent>
    )
  }

  render () {
    const { ticker, value, style, width, needsParse } = this.props
    const formattedValue = value
      ? formatBalance(value, 6, needsParse, ticker)
      : '...'

    return (
      <div className="ether-balance ether-balance-amount" style={style}>
        <div style={{
          display: 'inline',
          width,
        }}
        >
          {this.renderBalance(formattedValue)}
        </div>
      </div>
    )
  }
}
