const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const CurrencyInput = require('../currency-input')
const { conversionUtil, multiplyCurrencies } = require('../../conversion-util')
const currencyFormatter = require('currency-formatter')
const currencies = require('currency-formatter/currencies')

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

CurrencyDisplay.prototype.getConvertedValueToRender = function (nonFormattedValue) {
  const { primaryCurrency, convertedCurrency, conversionRate } = this.props

  let convertedValue = conversionUtil(nonFormattedValue, {
    fromNumericBase: 'dec',
    fromCurrency: primaryCurrency,
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })
  convertedValue = Number(convertedValue).toFixed(2)

  const upperCaseCurrencyCode = convertedCurrency.toUpperCase()

  return currencies.find(currency => currency.code === upperCaseCurrencyCode)
    ? currencyFormatter.format(Number(convertedValue), {
      code: upperCaseCurrencyCode,
    })
    : convertedValue
}

CurrencyDisplay.prototype.render = function () {
  const {
    className = 'currency-display',
    primaryBalanceClassName = 'currency-display__input',
    convertedBalanceClassName = 'currency-display__converted-value',
    primaryCurrency,
    convertedCurrency,
    readOnly = false,
    inError = false,
    handleChange,
  } = this.props

  const valueToRender = this.getValueToRender()
  const convertedValueToRender = this.getConvertedValueToRender(valueToRender)

  return h('div', {
    className,
    style: {
      borderColor: inError ? 'red' : null,
    },
    onClick: () => this.currencyInput && this.currencyInput.focus(),
  }, [

    h('div.currency-display__primary-row', [

      h('div.currency-display__input-wrapper', [

        h(readOnly ? 'input' : CurrencyInput, {
          className: primaryBalanceClassName,
          value: `${valueToRender}`,
          placeholder: '0',
          readOnly,
          ...(!readOnly ? {
            onInputChange: newValue => {
              handleChange(this.getAmount(newValue))
            },
            inputRef: input => { this.currencyInput = input },
          } : {}),
        }),

        h('span.currency-display__currency-symbol', primaryCurrency),

      ]),

    ]),

    h('div', {
      className: convertedBalanceClassName,
    }, null),

  ])

}

