const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const BN = ethUtil.BN

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
  const decimalValue = decimalize(value)

  return (
    h('input', {
      style: {
        display: 'block',
        textAlign: 'right',
      },
      value: decimalValue,
      onChange: (event) => {
        const hexString = hexify(event.target.value)
        onChange(hexString)
      },
    })
  )
}

function hexify (decimalString) {
  const hexBN = new BN(decimalString, 10)
  return '0x' + hexBN.toString('hex')
}

function decimalize (input) {
  const strippedInput = ethUtil.stripHexPrefix(input)
  const inputBN = new BN(strippedInput, 'hex')
  return inputBN.toString(10)
}
