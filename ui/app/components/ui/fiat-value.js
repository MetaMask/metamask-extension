<<<<<<< HEAD
const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const formatBalance = require('../../helpers/utils/util').formatBalance
=======
import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { formatBalance } from '../../helpers/utils/util'
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

export default class FiatValue extends Component {
  static propTypes = {
    conversionRate: PropTypes.number.isRequired,
    currentCurrency: PropTypes.string,
    style: PropTypes.object,
    value: PropTypes.string.isRequired,
  }

  render () {
    const { conversionRate, currentCurrency, style } = this.props
    const renderedCurrency = currentCurrency || ''

    const value = formatBalance(this.props.value, 6)

    if (value === 'None') {
      return value
    }
    let fiatDisplayNumber, fiatTooltipNumber
    const splitBalance = value.split(' ')

<<<<<<< HEAD
  if (value === 'None') return value
  var fiatDisplayNumber, fiatTooltipNumber
  var splitBalance = value.split(' ')
=======
    if (conversionRate !== 0) {
      fiatTooltipNumber = Number(splitBalance[0]) * conversionRate
      fiatDisplayNumber = fiatTooltipNumber.toFixed(2)
    } else {
      fiatDisplayNumber = 'N/A'
    }
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc

    return fiatDisplay(fiatDisplayNumber, renderedCurrency.toUpperCase(), style)
  }
}

function fiatDisplay (fiatDisplayNumber, fiatSuffix, styleOveride = {}) {
  const { fontSize, color, fontFamily, lineHeight } = styleOveride

  if (fiatDisplayNumber !== 'N/A') {
    return h('.flex-row', {
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
          fontSize: fontSize || '12px',
          color: color || '#333333',
        },
      }, fiatDisplayNumber),
      h('div', {
        style: {
          color: color || '#AEAEAE',
          marginLeft: '5px',
          fontSize: fontSize || '12px',
        },
      }, fiatSuffix),
    ])
  } else {
    return h('div')
  }
}
