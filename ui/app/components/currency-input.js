const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = CurrencyInput

inherits(CurrencyInput, Component)
function CurrencyInput (props) {
  Component.call(this)

  const sanitizedValue = sanitizeValue(props.value)

  this.state = {
    value: sanitizedValue,
    emptyState: false,
    focused: false,
  }
}

function removeNonDigits (str) {
  return str.match(/\d|$/g).join('')
}

// Removes characters that are not digits, then removes leading zeros
function sanitizeInteger (val) {
  return String(parseInt(removeNonDigits(val) || '0', 10))
}

function sanitizeDecimal (val) {
  return removeNonDigits(val)
}

// Take a single string param and returns a non-negative integer or float as a string.
// Breaks the input into three parts: the integer, the decimal point, and the decimal/fractional part.
// Removes leading zeros from the integer, and non-digits from the integer and decimal
// The integer is returned as '0' in cases where it would be empty. A decimal point is
// included in the returned string if one is included in the param
// Examples:
//  sanitizeValue('0') -> '0'
//  sanitizeValue('a') -> '0'
//  sanitizeValue('010.') -> '10.'
//  sanitizeValue('0.005') -> '0.005'
//  sanitizeValue('22.200') -> '22.200'
//  sanitizeValue('.200') -> '0.200'
//  sanitizeValue('a.b.1.c,89.123') -> '0.189123'
function sanitizeValue (value) {
  let [ , integer, point, decimal] = (/([^.]*)([.]?)([^.]*)/).exec(value)

  integer = sanitizeInteger(integer) || '0'
  decimal = sanitizeDecimal(decimal)

  return `${integer}${point}${decimal}`
}

CurrencyInput.prototype.handleChange = function (newValue) {
  const { onInputChange } = this.props
  const { value } = this.state

  let parsedValue = newValue
  const newValueLastIndex = newValue.length - 1

  if (value === '0' && newValue[newValueLastIndex] === '0') {
    parsedValue = parsedValue.slice(0, newValueLastIndex)
  }
  const sanitizedValue = sanitizeValue(parsedValue)
  this.setState({
    value: sanitizedValue,
    emptyState: newValue === '' && sanitizedValue === '0',
  })
  onInputChange(sanitizedValue)
}

CurrencyInput.prototype.render = function () {
  const {
    className,
    placeholder,
    readOnly,
    inputRef,
    type,
    value,
  } = this.props
  const { emptyState, focused, value: stateValue } = this.state
  const inputSizeMultiplier = readOnly ? 1 : 1.2
  const valueToRender = (typeof stateValue === 'undefined' || value !== stateValue) ?
    sanitizeValue(value) : stateValue

  return h('input', {
    className,
    type,
    value: emptyState ? '' : valueToRender,
    placeholder: focused ? '' : placeholder,
    size: valueToRender.length * inputSizeMultiplier,
    readOnly,
    onFocus: () => this.setState({ focused: true, emptyState: valueToRender === '0' }),
    onBlur: () => this.setState({ focused: false, emptyState: false }),
    onChange: e => this.handleChange(e.target.value),
    ref: inputRef,
  })
}
