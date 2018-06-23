const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const {
  conversionGTE,
  conversionLTE,
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

function removeLeadingZeroes (str) {
  return str.replace(/^0*(?=\d)/, '')
}

InputNumber.prototype.setValue = function (newValue) {
  newValue = removeLeadingZeroes(newValue)
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
<<<<<<< HEAD
  const { unitLabel, step = 1, placeholder, value } = this.props
=======
  const { unitLabel, step = 1, placeholder, value = 0, min = -1, max = Infinity } = this.props
>>>>>>> Refactor and redesign confirm transaction views

  return h('div.customize-gas-input-wrapper', {}, [
    h('input', {
      className: 'customize-gas-input',
      value,
      placeholder,
      type: 'number',
      onChange: e => {
        this.setValue(e.target.value)
      },
      min: 0,
    }),
    h('span.gas-tooltip-input-detail', {}, [unitLabel]),
    h('div.gas-tooltip-input-arrows', {}, [
      h('i.fa.fa-angle-up', {
<<<<<<< HEAD
        onClick: () => this.setValue(addCurrencies(value, step, { toNumericBase: 'dec' })),
      }),
      h('i.fa.fa-angle-down', {
        style: { cursor: 'pointer' },
        onClick: () => this.setValue(subtractCurrencies(value, step, { toNumericBase: 'dec' })),
=======
        onClick: () => this.setValue(Math.min(+value + step, max)),
      }),
      h('i.fa.fa-angle-down', {
        style: { cursor: 'pointer' },
        onClick: () => this.setValue(Math.max(+value - step, min)),
>>>>>>> Refactor and redesign confirm transaction views
      }),
    ]),
  ])
}
