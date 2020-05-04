import { Component } from 'react'
const h = require('react-hyperscript')
const inherits = require('util').inherits
import ethUtil from 'ethereumjs-util'
import extend from 'xtend'

module.exports = BinaryRenderer

inherits(BinaryRenderer, Component)
function BinaryRenderer () {
  Component.call(this)
}

BinaryRenderer.prototype.render = function () {
  const props = this.props
  const { value, style } = props
  const message = this.msgHexToText(value)

  const defaultStyle = extend({
    width: '100%',
    maxHeight: '210px',
    resize: 'none',
    border: 'none',
    background: '#542289',
    color: 'white',
    padding: '20px',
  }, style)

  return (
    h('textarea.font-small', {
      readOnly: true,
      style: defaultStyle,
      defaultValue: message,
    })
  )
}

BinaryRenderer.prototype.msgHexToText = (hex) => {
  try {
    const stripped = ethUtil.stripHexPrefix(hex)
    const buff = Buffer.from(stripped, 'hex')
    return buff.length === 32 ? hex : buff.toString('utf8')
  } catch (e) {
    return hex
  }
}

