const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const CurrencyInput = require('../currency-input')
const { conversionUtil, multiplyCurrencies } = require('../../conversion-util')

module.exports = CurrencyDisplay

inherits(CurrencyDisplay, Component)
function CurrencyDisplay () {
  Component.call(this)
}

function toHexWei (value) {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toDenomination: 'WEI',
  })
}

CurrencyDisplay.prototype.getAmount = function (value) {
  const { selectedToken } = this.props
  const { decimals } = selectedToken || {}
  const multiplier = Math.pow(10, Number(decimals || 0))

  const sendAmount = multiplyCurrencies(value, multiplier, {toNumericBase: 'hex'})

  return selectedToken
    ? sendAmount
    : toHexWei(value)
}

CurrencyDisplay.prototype.getValueToRender = function () {
  const { selectedToken, conversionRate, value } = this.props

  const { decimals, symbol } = selectedToken || {}
  const multiplier = Math.pow(10, Number(decimals || 0))

  return selectedToken
    ? conversionUtil(value, {
      fromNumericBase: 'hex',
      toCurrency: symbol,
      conversionRate: multiplier,
      invertConversionRate: true,
    })
    : conversionUtil(value, {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      fromDenomination: 'WEI',
      numberOfDecimals: 6,
      conversionRate,
    })
}

CurrencyDisplay.prototype.render = function () {
  const {
    className = 'currency-display',
    primaryBalanceClassName = 'currency-display__input',
    convertedBalanceClassName = 'currency-display__converted-value',
    conversionRate,
    primaryCurrency,
    convertedCurrency,
    readOnly = false,
    inError = false,
    handleChange,
  } = this.props

  const valueToRender = this.getValueToRender()

  let convertedValue = conversionUtil(valueToRender, {
    fromNumericBase: 'dec',
    fromCurrency: primaryCurrency,
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })
  convertedValue = Number(convertedValue).toFixed(2)

  return h('div', {
    className,
    style: {
      borderColor: inError ? 'red' : null,
    },
    onClick: () => this.currencyInput.focus(),
  }, [

    h('div.currency-display__primary-row', [

      h('div.currency-display__input-wrapper', [

        h(CurrencyInput, {
          className: primaryBalanceClassName,
          value: `${valueToRender}`,
          placeholder: '0',
          readOnly,
          onInputChange: newValue => {
            handleChange(this.getAmount(newValue))
          },
          inputRef: input => { this.currencyInput = input },
        }),

        h('span.currency-display__currency-symbol', primaryCurrency),

      ]),

    ]),

    h('div', {
      className: convertedBalanceClassName,
    }, `${convertedValue} ${convertedCurrency.toUpperCase()}`),

  ])

}

