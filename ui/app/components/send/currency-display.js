const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('../identicon')
const { conversionUtil } = require('../../conversion-util')

module.exports = CurrencyDisplay

inherits(CurrencyDisplay, Component)
function CurrencyDisplay () {
  Component.call(this)

  this.state = {
    minWidth: null,
    currentScrollWidth: null,
  }
}

function isValidInput (text) {
  const re = /^([1-9]\d*|0)(\.|\.\d*)?$/
  return re.test(text)
}

function resetCaretIfPastEnd (value, event) {
  const caretPosition = event.target.selectionStart

  if (caretPosition > value.length) {
    event.target.setSelectionRange(value.length, value.length)
  }
}

CurrencyDisplay.prototype.render = function () {
  const {
    className = 'currency-display',
    primaryBalanceClassName = 'currency-display__input',
    convertedBalanceClassName = 'currency-display__converted-value',
    conversionRate,
    primaryCurrency,
    convertedCurrency,
    convertedPrefix = '',
    handleChange,
    placeholder = '0',
    readOnly = false,
    value = '',
  } = this.props
  const { minWidth } = this.state

  const valueToRender = conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
    conversionRate,
  })

  const convertedValue = conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency: primaryCurrency,
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })

  return h('div', {
    className,
  }, [

    h('div.currency-display__primary-row', [

      h('div.currency-display__input-wrapper', [

        h('input', {
          className: primaryBalanceClassName,
          value: `${valueToRender} ${primaryCurrency}`,
          placeholder: `${0} ${primaryCurrency}`,
          readOnly,
          onChange: (event) => {
            let newValue = event.target.value.split(' ')[0]

            if (newValue === '') {
              handleChange('0')
            }
            else if (newValue.match(/^0[1-9]$/)) {
              handleChange(newValue.match(/[1-9]/)[0])
            }
            else if (newValue && !isValidInput(newValue)) {
              event.preventDefault()
            }
            else {
              handleChange(newValue)
            }
          },
          onKeyUp: event => resetCaretIfPastEnd(value, event),
          onClick: event => resetCaretIfPastEnd(value, event),
        }),

      ]),

    ]),

    h('div', {
      className: convertedBalanceClassName,
    }, `${convertedPrefix}${convertedValue} ${convertedCurrency}`),

  ])
    
}

