const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const classnames = require('classnames')

module.exports = CurrencyToggle

inherits(CurrencyToggle, Component)
function CurrencyToggle () {
  Component.call(this)
}

const defaultCurrencies = [ 'ETH', 'USD' ]

CurrencyToggle.prototype.render = function () {
  const { onClick, currentCurrency } = this.props
  const [currencyA, currencyB] = this.props.currencies || defaultCurrencies

  return h('span.currency-toggle', {}, [
    h('span', {
      className: classnames('currency-toggle__item', {
        'currency-toggle__item--selected': currencyA === currentCurrency,
      }),
      onClick: () => onClick(currencyA),
    }, ['ETH']),
    '<>',
    h('span', {
      className: classnames('currency-toggle__item', {
        'currency-toggle__item--selected': currencyB === currentCurrency,
      }),
      onClick: () => onClick(currencyB),
    }, ['USD']),
  ]) // holding on icon from design
}

