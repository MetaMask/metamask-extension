const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
module.exports = CurrencyToggle

inherits(CurrencyToggle, Component)
function CurrencyToggle () {
  Component.call(this)
}

CurrencyToggle.prototype.render = function () {
  const { onClick, currentCurrency } = this.props

  return h('span', {}, [
    h('span', {
      className: currentCurrency === 'ETH' ? 'selected-currency' : 'unselected-currency',
      onClick: () => onClick('ETH'),
    }, ['ETH']),
    '<>',
    h('span', {
      className: currentCurrency === 'USD' ? 'selected-currency' : 'unselected-currency',
      onClick: () => onClick('USD'),
    }, ['USD']),
  ]) // holding on icon from design
}

