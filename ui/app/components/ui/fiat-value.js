import React, { Component } from 'react'
const inherits = require('util').inherits
const formatBalance = require('../../helpers/utils/util').formatBalance

module.exports = FiatValue

inherits(FiatValue, Component)
function FiatValue () {
  Component.call(this)
}

FiatValue.prototype.render = function () {
  const props = this.props
  const { conversionRate, currentCurrency, style } = props
  const renderedCurrency = currentCurrency || ''

  const value = formatBalance(props.value, 6)

  if (value === 'None') {
    return value
  }
  let fiatDisplayNumber, fiatTooltipNumber
  const splitBalance = value.split(' ')

  if (conversionRate !== 0) {
    fiatTooltipNumber = Number(splitBalance[0]) * conversionRate
    fiatDisplayNumber = fiatTooltipNumber.toFixed(2)
  } else {
    fiatDisplayNumber = 'N/A'
    fiatTooltipNumber = 'Unknown'
  }

  return fiatDisplay(fiatDisplayNumber, renderedCurrency.toUpperCase(), style)
}

function fiatDisplay (fiatDisplayNumber, fiatSuffix, styleOveride = {}) {
  const { fontSize, color, fontFamily, lineHeight } = styleOveride

  if (fiatDisplayNumber !== 'N/A') {
    return (
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
            fontSize: fontSize || '12px',
            color: color || '#333333',
          }}
        >
          {fiatDisplayNumber}
        </div>
        <div
          style={{
            color: color || '#AEAEAE',
            marginLeft: '5px',
            fontSize: fontSize || '12px',
          }}
        >
          {fiatSuffix}
        </div>
      </div>
    )
  } else {
    return <div />
  }
}
