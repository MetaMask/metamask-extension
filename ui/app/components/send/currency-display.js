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
    className,
    primaryCurrency,
    convertedCurrency,
    value = '',
    placeholder = '0',
    conversionRate,
    convertedPrefix = '',
    readOnly = false,
    handleChange,
  } = this.props
  const { minWidth } = this.state

  const convertedValue = conversionUtil(value, {
    fromNumericBase: 'dec',
    fromCurrency: primaryCurrency,
    toCurrency: convertedCurrency,
    conversionRate,
  })

  return h('div.currency-display', {
    className,
  }, [

    h('div.currency-display__primary-row', [

      h('div.currency-display__input-wrapper', [

        h('input.currency-display__input', {
          value: `${value} ${primaryCurrency}`,
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

    h('div.currency-display__converted-value', {}, `${convertedPrefix}${convertedValue} ${convertedCurrency}`),

  ])
    
}

