import React, { Component } from 'react'
import { formatBalance } from '../util'
import PropTypes from 'prop-types'

class FiatValue extends Component {
  render = () => {
    const props = this.props
    let { conversionRate } = props
    const { currentCurrency, network } = props
    const isSokol = parseInt(network) === 77
    const isDai = parseInt(network) === 100
    if (isSokol) {
      conversionRate = 0
    } else if (isDai) {
      conversionRate = 1
    }
    const renderedCurrency = currentCurrency || ''

    const value = formatBalance(props.value, 6, undefined, props.network)

    if (value === 'None') return value
    let fiatDisplayNumber, fiatTooltipNumber
    const splitBalance = value.split(' ')

    fiatTooltipNumber = Number(splitBalance[0]) * conversionRate
    fiatDisplayNumber = fiatTooltipNumber.toFixed(this.countSignificantDecimals(fiatTooltipNumber, 2))

    const valueStyle = props.valueStyle ? props.valueStyle : {
      width: '100%',
      textAlign: 'right',
      fontSize: '14px',
      color: '#ffffff',
    }

    const dimStyle = props.dimStyle ? props.dimStyle : {
      color: '#60db97',
      marginLeft: '5px',
      fontSize: '14px',
    }

    return this.fiatDisplay(fiatDisplayNumber, valueStyle, dimStyle, renderedCurrency.toUpperCase())
  }

  /**
   * returns the length of truncated significant decimals for fiat value
   * @param {float} val The float value to be truncated
   * @param {number} len The length of significant decimals
   * returns {number} The length of truncated significant decimals
  **/
  countSignificantDecimals = (val, len) => {
      if (Math.floor(val) === val) {
        return 0
      }
      const decimals = val.toString().split('.')[1]
      const decimalsArr = decimals.split('')
      let decimalsLen = decimalsArr.slice(0).reduce((res, val, ind, arr) => {
        if (Number(val) === 0) {
          res += 1
        } else {
          arr.splice(1) // break reduce function
        }
        return res
      }, 0)
      decimalsLen += len
      const valWithSignificantDecimals = `${Math.floor(val)}.${decimalsArr.slice(0, decimalsLen).join('')}`
      decimalsLen = parseFloat(valWithSignificantDecimals).toString().split('.')[1].length
      return decimalsLen || 0
  }

  fiatDisplay = (fiatDisplayNumber, valueStyle, dimStyle, fiatSuffix) => {

    if (fiatDisplayNumber !== 'N/A') {
      return (
        <div
          className="flex-row"
          style={{
            alignItems: 'flex-end',
            lineHeight: '14px',
            textRendering: 'geometricPrecision',
          }}
        >
          <div className="fiat-val" style={valueStyle}>{fiatDisplayNumber}</div>
          <div className="fiat-dim" style={dimStyle}>{fiatSuffix}</div>
        </div>
      )
    } else {
      return <div/>
    }
  }
}

FiatValue.propTypes = {
  conversionRate: PropTypes.number,
  currentCurrency: PropTypes.string,
  network: PropTypes.string,
}

module.exports = FiatValue
