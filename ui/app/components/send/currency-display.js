const Component = require('react').Component
const h = require('react-hyperscript')
const inherits = require('util').inherits
const Identicon = require('../identicon')
const AutosizeInput = require('react-input-autosize').default
const { conversionUtil } = require('../../conversion-util')

module.exports = CurrencyDisplay

inherits(CurrencyDisplay, Component)
function CurrencyDisplay () {
  Component.call(this)

  this.state = {
    minWidth: null,
  }
}

function isValidNumber (text) {
  const re = /^([1-9]\d*|0)(\.|\.\d*)?$/
  return re.test(text)
}

CurrencyDisplay.prototype.componentDidMount = function () {
  this.setState({ minWidth: this.refs.currencyDisplayInput.sizer.scrollWidth + 10 })
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
    inputFontSize,
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

      h(AutosizeInput, {
        ref: 'currencyDisplayInput',
        className: 'currency-display__input-wrapper',
        inputClassName: 'currency-display__input',
        value,
        placeholder,
        readOnly,
        minWidth,
        onChange: (event) => {
          const newValue = event.target.value
          if (newValue && !isValidNumber(newValue)) {
            event.preventDefault()
          }
          else {
            handleChange(newValue)
          }
        },
        style: { fontSize: inputFontSize },
      }),

      h('span.currency-display__primary-currency', {}, primaryCurrency),

    ]),

    h('div.currency-display__converted-value', {}, `${convertedPrefix}${convertedValue} ${convertedCurrency}`),

  ])
    
}

