const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN
const extend = require('xtend')

module.exports = HexAsDecimalInput

inherits(HexAsDecimalInput, Component)
function HexAsDecimalInput () {
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
  const { value, onChange } = props
  const toEth = props.toEth
  const suffix = props.suffix
  const decimalValue = decimalize(value, toEth)
  const style = props.style

  return (
    h('.flex-row', {
      style: {
        alignItems: 'flex-end',
        lineHeight: '13px',
        fontFamily: 'Montserrat Light',
        textRendering: 'geometricPrecision',
      },
    }, [
      h('input.ether-balance.ether-balance-amount', {
        type: 'number',
        style: extend({
          display: 'block',
          textAlign: 'right',
          backgroundColor: 'transparent',
          border: '1px solid #bdbdbd',

        }, style),
        value: decimalValue,
        onChange: (event) => {
          const hexString = (event.target.value === '') ? '' : hexify(event.target.value)
          onChange(hexString)
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
    ])
  )
}

function hexify (decimalString) {
  const hexBN = new BN(decimalString, 10)
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
