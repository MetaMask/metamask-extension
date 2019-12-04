const Component = require('react').Component
const h = require('react-hyperscript')
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
  const { unitLabel, step = 1, placeholder, value } = this.props

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
      h('div.gas-tooltip-input-arrow-wrapper', {
        onClick: () => this.setValue(addCurrencies(value, step, { toNumericBase: 'dec' })),
      }, [
        h('i.fa.fa-angle-up'),
      ]),
      h('div.gas-tooltip-input-arrow-wrapper', {
        onClick: () => this.setValue(subtractCurrencies(value, step, { toNumericBase: 'dec' })),
      }, [
        h('i.fa.fa-angle-down'),
      ]),
    ]),
  ])
}
