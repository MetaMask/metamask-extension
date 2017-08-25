const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const InputNumber = require('./input-number.js')

module.exports = GasTooltip

inherits(GasTooltip, Component)
function GasTooltip () {
  Component.call(this)
  this.state = {
    gasLimit: 0,
    gasPrice: 0,
  }

  this.updateGasPrice = this.updateGasPrice.bind(this);
  this.updateGasLimit = this.updateGasLimit.bind(this);
}

GasTooltip.prototype.componentWillMount == function () {
  const { gasPrice = 0, gasLimit = 0 } = this.props

  this.setState({ gasPrice, gasLimit });
}

GasTooltip.prototype.updateGasPrice = function (newPrice) {
  const { onFeeChange } = this.props
  const { gasLimit } = this.state

  this.setState({ gasPrice: newPrice })
  onFeeChange({ gasLimit, gasPrice: newPrice })
}

GasTooltip.prototype.updateGasLimit = function (newLimit) {
  const { onFeeChange } = this.props
  const { gasPrice } = this.state

  this.setState({ gasLimit: newLimit })
  onFeeChange({ gasLimit: newLimit, gasPrice })
}

GasTooltip.prototype.render = function () {
  const { position, title, children, className, isOpen } = this.props
  const { gasPrice, gasLimit } = this.state
  
  return isOpen
    ? h('div.customize-gas-tooltip-container', {}, [
        h('div.customize-gas-tooltip', {}, [
          h('div.gas-tooltip-header.gas-tooltip-label', {}, ['Customize Gas']),
          h('div.gas-tooltip-input-label', {}, [
            h('span.gas-tooltip-label', {}, ['Gas Price']),
            h('i.fa.fa-info-circle')
          ]),
          h(InputNumber, {
            unitLabel: 'GWEI',
            step: 0.0001,
            min: 0.0000,
            placeholder: '0.0000',
            fixed: 4,
            initValue: gasPrice,
            onChange: (newPrice) => this.updateGasPrice(newPrice), 
          }),
          h('div.gas-tooltip-input-label', {}, [
            h('span.gas-tooltip-label', {}, ['Gas Limit']),
            h('i.fa.fa-info-circle')
          ]),
          h(InputNumber, {
            unitLabel: 'UNITS',
            step: 1,
            min: 0,
            placeholder: '0',
            initValue: gasLimit,
            onChange: (newLimit) => this.updateGasLimit(newLimit),  
          }),
        ]),
        h('div.gas-tooltip-arrow', {}),
      ])
    : null
}
