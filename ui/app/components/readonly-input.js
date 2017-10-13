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
    wrapperClass = '',
    inputClass = '',
    value,
    textarea,
    onClick,
  } = this.props

  const inputType = textarea ? 'textarea' : 'input'

  return h('div', {className: wrapperClass}, [
    h(inputType, {
      className: inputClass,
      value,
      readOnly: true,
      onFocus: event => event.target.select(),
      onClick,
    }),
  ])
}

