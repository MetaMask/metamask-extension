const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const extend = require('xtend')

module.exports = HexAsDecimalInput

inherits(HexAsDecimalInput, Component)
function HexAsDecimalInput () {
  this.state = { invalid: null }
  Component.call(this)
}

/* Hex as Decimal Input
 *
 * A component for allowing easy, decimal editing
 * of a passed in hex string value.
 *
 * On change, calls back its `onChange` function parameter
 * and passes it an updated hex string.
 */

HexAsDecimalInput.prototype.render = function () {
  const props = this.props
  const state = this.state

  const { value, onChange, min, max } = props

  const toEth = props.toEth
  const suffix = props.suffix
  const decimalValue = decimalize(value, toEth)
  const style = props.style

  return (
    h('.flex-column', [
      h('.flex-row', {
        style: {
          alignItems: 'flex-end',
          lineHeight: '13px',
          fontFamily: 'Montserrat Light',
          textRendering: 'geometricPrecision',
        },
      }, [
        h('input.hex-input', {
          type: 'number',
          required: true,
          min: min,
          max: max,
          style: extend({
            display: 'block',
            textAlign: 'right',
            backgroundColor: 'transparent',
            border: '1px solid #bdbdbd',

          }, style),
          value: parseInt(decimalValue),
          onBlur: (event) => {
            this.updateValidity(event)
          },
          onChange: (event) => {
            this.updateValidity(event)
            const hexString = (event.target.value === '') ? '' : hexify(event.target.value)
            onChange(hexString)
          },
          onInvalid: (event) => {
            const msg = this.constructWarning()
            if (msg === state.invalid) {
              return
            }
            this.setState({ invalid: msg })
            event.preventDefault()
            return false
          },
        }),
        h('div', {
          style: {
            color: ' #AEAEAE',
            fontSize: '12px',
            marginLeft: '5px',
            marginRight: '6px',
            width: '20px',
          },
        }, suffix),
      ]),

      state.invalid ? h('span.error', {
        style: {
          position: 'absolute',
          right: '0px',
          textAlign: 'right',
          transform: 'translateY(26px)',
          padding: '3px',
          background: 'rgba(255,255,255,0.85)',
          zIndex: '1',
          textTransform: 'capitalize',
          border: '2px solid #E20202',
        },
      }, state.invalid) : null,
    ])
  )
}

HexAsDecimalInput.prototype.setValid = function (message) {
  this.setState({ invalid: null })
}

HexAsDecimalInput.prototype.updateValidity = function (event) {
  const target = event.target
  const value = this.props.value
  const newValue = target.value

  if (value === newValue) {
    return
  }

  const valid = target.checkValidity()
  if (valid) {
    this.setState({ invalid: null })
  }
}

HexAsDecimalInput.prototype.constructWarning = function () {
  const { name, min, max } = this.props
  let message = name ? name + ' ' : ''

  if (min && max) {
    message += `must be greater than or equal to  ${min} and less than or equal to ${max}.`
  } else if (min) {
    message += `must be greater than or equal to ${min}.`
  } else if (max) {
    message += `must be less than or equal to ${max}.`
  } else {
    message += 'Invalid input.'
  }

  return message
}

function hexify (decimalString) {
  const hexBN = new BN(decimalString.split('.')[0], 10)
  return '0x' + hexBN.toString('hex')
}

function decimalize (input, toEth) {
  if (input === '') {
    return ''
  } else {
    const strippedInput = ethUtil.stripHexPrefix(input)
    const inputBN = new BN(strippedInput, 'hex')
    return inputBN.toString(10)
  }
}
