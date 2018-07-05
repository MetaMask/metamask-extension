const Component = require('react').Component
const PropTypes = require('prop-types')
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const extend = require('xtend')
const connect = require('react-redux').connect

BnAsDecimalInput.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect()(BnAsDecimalInput)


inherits(BnAsDecimalInput, Component)
function BnAsDecimalInput () {
  this.state = { invalid: null }
  Component.call(this)
}

/* Bn as Decimal Input
 *
 * A component for allowing easy, decimal editing
 * of a passed in bn string value.
 *
 * On change, calls back its `onChange` function parameter
 * and passes it an updated bn string.
 */

BnAsDecimalInput.prototype.render = function () {
  const props = this.props
  const state = this.state

  const { value, scale, precision, onChange, min, max } = props

  const suffix = props.suffix
  const style = props.style
  const valueString = value.toString(10)
  const newMin = min && this.downsize(min.toString(10), scale)
  const newMax = max && this.downsize(max.toString(10), scale)
  const newValue = this.downsize(valueString, scale)

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
          step: 'any',
          required: true,
          min: newMin,
          max: newMax,
          style: extend({
            display: 'block',
            textAlign: 'right',
            backgroundColor: 'transparent',
            border: '1px solid #bdbdbd',

          }, style),
          value: newValue,
          onBlur: (event) => {
            this.updateValidity(event)
          },
          onChange: (event) => {
            this.updateValidity(event)
            const value = (event.target.value === '') ? '' : event.target.value


            const scaledNumber = this.upsize(value, scale, precision)
            const precisionBN = new BN(scaledNumber, 10)
            onChange(precisionBN, event.target.checkValidity())
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

BnAsDecimalInput.prototype.setValid = function () {
  this.setState({ invalid: null })
}

BnAsDecimalInput.prototype.updateValidity = function (event) {
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

BnAsDecimalInput.prototype.constructWarning = function () {
  const { name, min, max, scale, suffix } = this.props
  const newMin = min && this.downsize(min.toString(10), scale)
  const newMax = max && this.downsize(max.toString(10), scale)
  let message = name ? name + ' ' : ''

  if (min && max) {
    message += this.context.t('betweenMinAndMax', [`${newMin} ${suffix}`, `${newMax} ${suffix}`])
  } else if (min) {
    message += this.context.t('greaterThanMin', [`${newMin} ${suffix}`])
  } else if (max) {
    message += this.context.t('lessThanMax', [`${newMax} ${suffix}`])
  } else {
    message += this.context.t('invalidInput')
  }

  return message
}


BnAsDecimalInput.prototype.downsize = function (number, scale) {
  // if there is no scaling, simply return the number
  if (scale === 0) {
    return Number(number)
  } else {
    // if the scale is the same as the precision, account for this edge case.
    var adjustedNumber = number
    while (adjustedNumber.length < scale) {
      adjustedNumber = '0' + adjustedNumber
    }
    return Number(adjustedNumber.slice(0, -scale) + '.' + adjustedNumber.slice(-scale))
  }
}

BnAsDecimalInput.prototype.upsize = function (number, scale, precision) {
  var stringArray = number.toString().split('.')
  var decimalLength = stringArray[1] ? stringArray[1].length : 0
  var newString = stringArray[0]

  // If there is scaling and decimal parts exist, integrate them in.
  if ((scale !== 0) && (decimalLength !== 0)) {
    newString += stringArray[1].slice(0, precision)
  }

  // Add 0s to account for the upscaling.
  for (var i = decimalLength; i < scale; i++) {
    newString += '0'
  }
  return newString
}
