import PropTypes from 'prop-types'
import React, { Component } from 'react'
import { addCurrencies, conversionGTE, conversionLTE, subtractCurrencies } from '../../helpers/utils/conversion-util'

export default class InputNumber extends Component {
  static propTypes = {
    fixed: PropTypes.bool.isRequired,
    min: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    unitLabel: PropTypes.string.isRequired,
    step: PropTypes.number.isRequired,
    placeholder: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
  }

  setValue = (newValue) => {
    newValue = removeLeadingZeroes(newValue)
    if (newValue && !isValidInput(newValue)) {
      return
    }
    const { fixed, min = -1, max = Infinity, onChange } = this.props

    newValue = fixed ? newValue.toFixed(4) : newValue
    const newValueGreaterThanMin = conversionGTE(
      { value: newValue || '0', fromNumericBase: 'dec' },
      { value: min, fromNumericBase: 'hex' },
    )

    const newValueLessThanMax = conversionLTE(
      { value: newValue || '0', fromNumericBase: 'dec' },
      { value: max, fromNumericBase: 'hex' },
    )
    if (newValueGreaterThanMin && newValueLessThanMax) {
      onChange(newValue)
    } else if (!newValueGreaterThanMin) {
      onChange(min)
    } else if (!newValueLessThanMax) {
      onChange(max)
    }
  }

  render () {
    const { unitLabel, step = 1, placeholder, value } = this.props

    return (
      <div className="customize-gas-input-wrapper">
        <input
          className="customize-gas-input"
          value={value}
          placeholder={placeholder}
          type="number"
          onChange={e => {
            this.setValue(e.target.value)
          }}
          min={0}
        />
        <span className="gas-tooltip-input-detail">{unitLabel}</span>
        <div className="gas-tooltip-input-arrows">
          <div
            className="gas-tooltip-input-arrow-wrapper"
            onClick={() => this.setValue(addCurrencies(value, step, { toNumericBase: 'dec' }))}
          >
            <i className="fa fa-angle-up" />
          </div>
          <div
            className="gas-tooltip-input-arrow-wrapper"
            onClick={() => this.setValue(subtractCurrencies(value, step, { toNumericBase: 'dec' }))}
          >
            <i className="fa fa-angle-down" />
          </div>
        </div>
      </div>
    )
  }
}

function isValidInput (text) {
  const re = /^([1-9]\d*|0)(\.|\.\d*)?$/
  return re.test(text)
}

function removeLeadingZeroes (str) {
  return str.replace(/^0*(?=\d)/, '')
}
