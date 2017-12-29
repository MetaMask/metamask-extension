const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = CurrencyInput

inherits(CurrencyInput, Component)
function CurrencyInput (props) {
  Component.call(this)

  this.state = {
    value: sanitizeValue(props.value),
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

  this.setState({ value: sanitizeValue(newValue) })

  onInputChange(sanitizeValue(newValue))
}

// If state.value === props.value plus a decimal point, or at least one
// zero or a decimal point and at least one zero, then this returns state.value
// after it is sanitized with getValueParts
CurrencyInput.prototype.getValueToRender = function () {
  const { value } = this.props
  const { value: stateValue } = this.state

  const trailingStateString = (new RegExp(`^${value}(.+)`)).exec(stateValue)
  const trailingDecimalAndZeroes = trailingStateString && (/^[.0]0*/).test(trailingStateString[1])

  return sanitizeValue(trailingDecimalAndZeroes
    ? stateValue
    : value)
}

CurrencyInput.prototype.render = function () {
  const {
    className,
    placeholder,
    readOnly,
    inputRef,
  } = this.props

  const inputSizeMultiplier = readOnly ? 1 : 1.2

  const valueToRender = this.getValueToRender()

  return h('input', {
    className,
    value: valueToRender,
    placeholder,
    size: valueToRender.length * inputSizeMultiplier,
    readOnly,
    onChange: e => this.handleChange(e.target.value),
    ref: inputRef, 
  })
}
