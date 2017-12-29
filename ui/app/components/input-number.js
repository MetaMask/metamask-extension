const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const CurrencyInput = require('./currency-input')
const {
  addCurrencies,
  conversionGTE,
  conversionLTE,
  subtractCurrencies,
} = require('../conversion-util')

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

InputNumber.prototype.setValue = function (newValue) {
  if (newValue && !isValidInput(newValue)) return
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

InputNumber.prototype.render = function () {
  const { unitLabel, step = 1, placeholder, value = 0 } = this.props

  return h('div.customize-gas-input-wrapper', {}, [
    h(CurrencyInput, {
      className: 'customize-gas-input',
      value,
      placeholder,
      onInputChange: newValue => {
        this.setValue(newValue)
      },
    }),
    h('span.gas-tooltip-input-detail', {}, [unitLabel]),
    h('div.gas-tooltip-input-arrows', {}, [
      h('i.fa.fa-angle-up', {
        onClick: () => this.setValue(addCurrencies(value, step)),
      }),
      h('i.fa.fa-angle-down', {
        style: { cursor: 'pointer' },
        onClick: () => this.setValue(subtractCurrencies(value, step)),
      }),
    ]),
  ])
}
