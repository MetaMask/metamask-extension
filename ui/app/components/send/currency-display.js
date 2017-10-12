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
    value: null,
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

CurrencyDisplay.prototype.handleChangeInHexWei = function (value) {
  const { handleChange } = this.props

  const valueInHexWei = conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toDenomination: 'WEI',
  })

  handleChange(valueInHexWei)
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
    placeholder = '0',
    readOnly = false,
    value: initValue,
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

  return h('div', {
    className,
  }, [

    h('div.currency-display__primary-row', [

      h('div.currency-display__input-wrapper', [

        h('input', {
          className: primaryBalanceClassName,
          value: `${value || initValueToRender} ${primaryCurrency}`,
          placeholder: `${0} ${primaryCurrency}`,
          readOnly,
          onChange: (event) => {
            let newValue = event.target.value.split(' ')[0]

            if (newValue === '') {
              this.setState({ value: '0' })
            }
            else if (newValue.match(/^0[1-9]$/)) {
              this.setState({ value: newValue.match(/[1-9]/)[0] })
            }
            else if (newValue && !isValidInput(newValue)) {
              event.preventDefault()
            }
            else {
              this.setState({ value: newValue })
            }
          },
          onBlur: event => this.handleChangeInHexWei(event.target.value.split(' ')[0]),
          onKeyUp: event => resetCaretIfPastEnd(value || initValueToRender, event),
          onClick: event => resetCaretIfPastEnd(value || initValueToRender, event),
        }),

      ]),

    ]),

    h('div', {
      className: convertedBalanceClassName,
    }, `${convertedPrefix}${convertedValue} ${convertedCurrency}`),

  ])
    
}

