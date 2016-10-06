const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = RangeSlider

inherits(RangeSlider, Component)
function RangeSlider () {
  Component.call(this)
}

RangeSlider.prototype.render = function () {
  const props = this.props
  const onChange = props.onChange || function () {}
  const name = props.name
  const {
    min = 0,
    max = 100,
    increment = 1,
    defaultValue = 50,
    mirrorInput = false,
  } = this.props.options
  const {container, input, range} = props.style

  return (
    h('.flex-row', {
      style: container,
    }, [
      h('input', {
        type: 'range',
        name: name,
        min: min,
        max: max,
        step: increment,
        style: range,
        defaultValue: defaultValue,
        onChange: mirrorInput ? this.mirrorInputs.bind(this, name) : onChange,
      }),

      // Mirrored input for range
      mirrorInput ? h('input.large-input', {
        type: 'number',
        name: `${name}Mirror`,
        min: min,
        max: max,
        defaultValue: defaultValue,
        step: increment,
        style: input,
        onChange: this.mirrorInputs.bind(this, `${name}Mirror`),
      }) : null,
    ])
  )
}

RangeSlider.prototype.mirrorInputs = function (active) {
  var range = document.querySelector(`input[name="${this.props.name}"]`)
  var inputMirror = document.querySelector(`input[name="${this.props.name}Mirror"]`)
  if (active === this.props.name) {
    inputMirror.value = range.value
  } else {
    range.value = inputMirror.value
  }
}
