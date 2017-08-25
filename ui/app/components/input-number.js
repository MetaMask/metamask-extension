const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const findDOMNode = require('react-dom').findDOMNode

module.exports = InputNumber

inherits(InputNumber, Component)
function InputNumber () {
  Component.call(this)

  this.state = {
    value: 0,
  }

  this.setValue = this.setValue.bind(this);
}

InputNumber.prototype.componentWillMount = function () {
  const { initValue = 0 } = this.props
  
  this.setState({ value: initValue });
}

InputNumber.prototype.setValue = function (newValue) {
  const { fixed, min, onChange } = this.props

  if (fixed) newValue = Number(newValue.toFixed(4))

  if (newValue >= min) {
    this.setState({ value: newValue })
    onChange(newValue)
  }
}

InputNumber.prototype.render = function () {
  const { unitLabel, step = 1, min, placeholder } = this.props
  const { value } = this.state
  
  return h('div.customize-gas-input-wrapper', {}, [
    h('input.customize-gas-input', {
      placeholder,
      type: 'number',
      value,
      onChange: (e) => this.setValue(Number(e.target.value))
    }),
    h('span.gas-tooltip-input-detail', {}, [unitLabel]),
    h('div.gas-tooltip-input-arrows', {}, [
      h('i.fa.fa-angle-up', {
        onClick: () => this.setValue(value + step)
      }),
      h('i.fa.fa-angle-down', {
        onClick: () => this.setValue(value - step)
      }),
    ]),
  ])
}
