const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const InputNumber = require('./input-number.js')
const findDOMNode = require('react-dom').findDOMNode

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
  this.onClose = this.onClose.bind(this);
}

GasTooltip.prototype.componentWillMount = function () {
  const { gasPrice = 0, gasLimit = 0} = this.props
  
  this.setState({
    gasPrice: parseInt(gasPrice, 16) / 1000000000,
    gasLimit: parseInt(gasLimit, 16),
  })
}

GasTooltip.prototype.updateGasPrice = function (newPrice) {
  const { onFeeChange } = this.props
  const { gasLimit } = this.state

  this.setState({ gasPrice: newPrice })
  onFeeChange({
    gasLimit: gasLimit.toString(16),
    gasPrice: (newPrice * 1000000000).toString(16)
  })
}

GasTooltip.prototype.updateGasLimit = function (newLimit) {
  const { onFeeChange } = this.props
  const { gasPrice } = this.state

  this.setState({ gasLimit: newLimit })
  onFeeChange({
    gasLimit: newLimit.toString(16),
    gasPrice: (gasPrice * 1000000000).toString(16)
  })
}

GasTooltip.prototype.onClose = function (e) {
  e.stopPropagation();
  this.props.onClose();
}

GasTooltip.prototype.render = function () {
  const { position, title, children, className } = this.props
  const { gasPrice, gasLimit } = this.state

  return h('div', {
    style: {
      display: 'flex',
      justifyContent: 'center',
    }
  }, [
    h('div.gas-tooltip-close-area', {
      onClick: this.onClose
    }),
    h('div.customize-gas-tooltip-container', {}, [
      h('div.customize-gas-tooltip', {}, [
        h('div.gas-tooltip-header.gas-tooltip-label', {}, ['Customize Gas']),
        h('div.gas-tooltip-input-label', {}, [
          h('span.gas-tooltip-label', {}, ['Gas Price']),
          h('i.fa.fa-info-circle')
        ]),
        h(InputNumber, {
          unitLabel: 'GWEI',
          step: 1,
          min: 0,
          placeholder: '0',
          initValue: gasPrice,
          onChange: (newPrice) => this.updateGasPrice(newPrice), 
        }),
        h('div.gas-tooltip-input-label', {
          style: {
            'marginTop': '81px',
          },
        }, [
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
  ])
}

