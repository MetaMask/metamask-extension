const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const {
  addCurrencies,
  conversionGTE,
  conversionLTE,
  toNegative,
} = require('../conversion-util')

module.exports = InputNumber

inherits(InputNumber, Component)
function InputNumber () {
  Component.call(this)

  this.setValue = this.setValue.bind(this)
}

InputNumber.prototype.setValue = function (newValue) {
  const { fixed, min = -1, max = Infinity, onChange } = this.props

  newValue = Number(fixed ? newValue.toFixed(4) : newValue)

  const newValueGreaterThanMin = conversionGTE(
    { value: newValue, fromNumericBase: 'dec' },
    { value: min, fromNumericBase: 'hex' },
  )

  const newValueLessThanMax = conversionLTE(
    { value: newValue, fromNumericBase: 'dec' },
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

InputNumber.prototype.render = function () {
  const { unitLabel, step = 1, placeholder, value = 0 } = this.props

  return h('div.customize-gas-input-wrapper', {}, [
    h('input.customize-gas-input', {
      placeholder,
      type: 'number',
      value,
      onChange: (e) => this.setValue(e.target.value),
    }),
    h('span.gas-tooltip-input-detail', {}, [unitLabel]),
    h('div.gas-tooltip-input-arrows', {}, [
      h('i.fa.fa-angle-up', {
        onClick: () => this.setValue(addCurrencies(value, step)),
      }),
      h('i.fa.fa-angle-down', {
        style: { cursor: 'pointer' },
        onClick: () => this.setValue(addCurrencies(value, toNegative(step))),
      }),
    ]),
  ])
}
