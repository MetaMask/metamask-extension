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

CurrencyToggle.prototype.renderToggles = function () {
  const { onClick, currentCurrency } = this.props
  const [currencyA, currencyB] = this.props.currencies || defaultCurrencies

  return [
    h('span', {
      className: classnames('currency-toggle__item', {
        'currency-toggle__item--selected': currencyA === currentCurrency,
      }),
      onClick: () => onClick(currencyA),
    }, [ currencyA ]),
    '<>',
    h('span', {
      className: classnames('currency-toggle__item', {
        'currency-toggle__item--selected': currencyB === currentCurrency,
      }),
      onClick: () => onClick(currencyB),
    }, [ currencyB ]),
  ]
}

CurrencyToggle.prototype.render = function () {
  const currencies = this.props.currencies || defaultCurrencies

  return h('span.currency-toggle', currencies.length
    ? this.renderToggles()
    : []
  )
}

