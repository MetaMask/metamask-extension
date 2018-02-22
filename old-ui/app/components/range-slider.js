const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits

module.exports = RangeSlider

inherits(RangeSlider, Component)
function RangeSlider () {
  Component.call(this)
}

RangeSlider.prototype.render = function () {
  const state = this.state || {}
  const props = this.props
  const onInput = props.onInput || function () {}
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
        value: state.value || defaultValue,
        onChange: mirrorInput ? this.mirrorInputs.bind(this, event) : onInput,
      }),

      // Mirrored input for range
      mirrorInput ? h('input.large-input', {
        type: 'number',
        name: `${name}Mirror`,
        min: min,
        max: max,
        value: state.value || defaultValue,
        step: increment,
        style: input,
        onChange: this.mirrorInputs.bind(this, event),
      }) : null,
    ])
  )
}

RangeSlider.prototype.mirrorInputs = function (event) {
  this.setState({value: event.target.value})
}
