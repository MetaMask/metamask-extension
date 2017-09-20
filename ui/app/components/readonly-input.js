const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = ReadOnlyInput

inherits(ReadOnlyInput, Component)
function ReadOnlyInput () {
  Component.call(this)
}

ReadOnlyInput.prototype.render = function () {
  const {
    wrapperClass,
    inputClass,
    value,
  } = this.props

  return h('div', {className: wrapperClass}, [
    h('input', {
      className: inputClass,
      value,
      readOnly: true,
    }),
  ])
}

