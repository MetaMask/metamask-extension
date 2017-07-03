const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const ethUtil = require('ethereumjs-util')
const extend = require('xtend')

module.exports = BinaryRenderer

inherits(BinaryRenderer, Component)
function BinaryRenderer () {
  Component.call(this)
}

BinaryRenderer.prototype.render = function () {
  const props = this.props
  const { value, style } = props
  const text = this.hexToText(value)

  const defaultStyle = extend({
    width: '315px',
    maxHeight: '210px',
    resize: 'none',
    border: 'none',
    background: 'white',
    padding: '3px',
  }, style)

  return (
    h('textarea.font-small', {
      readOnly: true,
      style: defaultStyle,
      defaultValue: text,
    })
  )
}

BinaryRenderer.prototype.hexToText = function (hex) {
  try {
    const stripped = ethUtil.stripHexPrefix(hex)
    const buff = Buffer.from(stripped, 'hex')
    return buff.toString('utf8')
  } catch (e) {
    return hex
  }
}

