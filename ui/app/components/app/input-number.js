import React from 'react'
const Component = require('react').Component
const inherits = require('util').inherits
const {
  addCurrencies,
  conversionGTE,
  conversionLTE,
  subtractCurrencies,
} = require('../../helpers/utils/conversion-util')

module.exports = InputNumber

inherits(InputNumber, Component)
function InputNumber () {
  Component.call(this)

  this.setValue = this.setValue.bind(this)
}

function isValidInput (text) {
  const re = /^([1-9]\d*|0)(\.|\.\d*)?$/
  return re.test(text)
}

function removeLeadingZeroes (str) {
  return str.replace(/^0*(?=\d)/, '')
}

InputNumber.prototype.setValue = function (newValue) {
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

InputNumber.prototype.render = function InputNumber () {
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
