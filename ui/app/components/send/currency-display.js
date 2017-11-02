const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const { conversionUtil, multiplyCurrencies } = require('../../conversion-util')

module.exports = CurrencyDisplay

inherits(CurrencyDisplay, Component)
function CurrencyDisplay () {
  Component.call(this)

  this.state = {
    value: null,
  }
}

function isValidInput (text) {
  const re = /^([1-9]\d*|0)(\.|\.\d*)?$/
  return re.test(text)
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
    value: initValue,
    handleChange,
    validate,
  } = this.props
  const { value } = this.state

  const initValueToRender = conversionUtil(initValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
    conversionRate,
  })

  const convertedValue = conversionUtil(value || initValueToRender, {
    fromNumericBase: 'dec',
    fromCurrency: primaryCurrency,
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })

  const inputSizeMultiplier = readOnly ? 1 : 1.2

  return h('div', {
    className,
    style: {
      borderColor: inError ? 'red' : null,
    },
  }, [

    h('div.currency-display__primary-row', [

      h('div.currency-display__input-wrapper', [

        h('input', {
          className: primaryBalanceClassName,
          value: `${value || initValueToRender}`,
          placeholder: '0',
          size: (value || initValueToRender).length * inputSizeMultiplier,
          readOnly,
          onChange: (event) => {
            let newValue = event.target.value

            if (newValue === '') {
              newValue = '0'
            } else if (newValue.match(/^0[1-9]$/)) {
              newValue = newValue.match(/[1-9]/)[0]
            }

            if (newValue && !isValidInput(newValue)) {
              event.preventDefault()
            } else {
              validate(this.getAmount(newValue))
              this.setState({ value: newValue })
            }
          },
          onBlur: event => !readOnly && handleChange(this.getAmount(event.target.value)),
        }),

        h('span.currency-display__currency-symbol', primaryCurrency),

      ]),

    ]),

    h('div', {
      className: convertedBalanceClassName,
    }, `${convertedValue} ${convertedCurrency.toUpperCase()}`),

  ])

}

