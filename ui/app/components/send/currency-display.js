import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { conversionUtil, multiplyCurrencies } from '../../conversion-util'
import { removeLeadingZeroes } from '../send_/send.utils'
import currencyFormatter from 'currency-formatter'
import currencies from 'currency-formatter/currencies'
import ethUtil from 'ethereumjs-util'


function toHexWei (value) {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toDenomination: 'WEI',
  })
}

export default class CurrencyDisplay extends Component {

  static propTypes = {
    selectedToken: PropTypes.object,
    primaryCurrency: PropTypes.string,
    convertedCurrency: PropTypes.string,
    conversionRate: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    className: PropTypes.string,
    primaryBalanceClassName: PropTypes.string,
    convertedBalanceClassName: PropTypes.string,
    readOnly: PropTypes.bool,
    inError: PropTypes.bool,
    step: PropTypes.number,
  }

  static defaultProps = {
    selectedToken: {},
    className: 'currency-display',
    primaryBalanceClassName: 'currency-display__input',
    convertedBalanceClassName: 'currency-display__converted-value',
    readOnly: false,
    inError: false,
  }

  state = {
    valueToRender: this.getValueToRender(this.props),
  }

  componentWillReceiveProps (nextProps) {
    const currentValueToRender = this.getValueToRender(this.props)
    const newValueToRender = this.getValueToRender(nextProps)
    if (currentValueToRender !== newValueToRender) {
      this.setState({
        valueToRender: newValueToRender,
      })
    }
  }

  getAmount (value) {
    const { selectedToken } = this.props
    const { decimals = 0 } = selectedToken
    const multiplier = Math.pow(10, Number(decimals))

    const sendAmount = multiplyCurrencies(value || '0', multiplier, {toNumericBase: 'hex'})

    return selectedToken
      ? sendAmount
      : toHexWei(value)
  }

  getValueToRender ({selectedToken, conversionRate, value, readOnly}) {
    if (value === '0x0') {
      return readOnly ? '0' : ''
    }

    const { decimals = 0, symbol } = selectedToken
    const multiplier = Math.pow(10, Number(decimals))

    return selectedToken
      ? conversionUtil(ethUtil.addHexPrefix(value), {
        fromNumericBase: 'hex',
        toNumericBase: 'dec',
        toCurrency: symbol,
        conversionRate: multiplier,
        invertConversionRate: true,
      })
      : conversionUtil(ethUtil.addHexPrefix(value), {
        fromNumericBase: 'hex',
        toNumericBase: 'dec',
        fromDenomination: 'WEI',
        numberOfDecimals: 9,
        conversionRate,
      })
  }

  getConvertedValueToRender (nonFormattedValue) {
    const {primaryCurrency, convertedCurrency, conversionRate} = this.props

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

  handleChange (event) {
    const { readOnly, onChange } = this.props
    if (!readOnly) {
      this.setState({valueToRender: removeLeadingZeroes(event.target.value)})
      onChange(this.getAmount(event.target.value))
    }
  }

  handleBlur () {
    const { readOnly, onBlur } = this.props
    const { valueToRender } = this.state
    if (!readOnly) {
      onBlur(this.getAmount(valueToRender))
    }
  }

  getInputWidth (valueToRender) {
    const valueString = String(valueToRender)
    const valueLength = valueString.length || 1
    const decimalPointDeficit = valueString.match(/\./) ? -0.5 : 0
    return (valueLength + decimalPointDeficit + 0.75) + 'ch'
  }

  render () {
    const {
      className,
      primaryBalanceClassName,
      convertedBalanceClassName,
      primaryCurrency,
      convertedCurrency,
      readOnly,
      inError,
      step,
    } = this.props
    const {valueToRender} = this.state

    const convertedValueToRender = this.getConvertedValueToRender(valueToRender)

    return (
      <div
        className={className}
        style={{
          borderColor: inError ? 'red' : null,
        }}
        onClick={() => {
          this.currencyInput && this.currencyInput.focus()
        }}
      >
        <div className={'currency-display__primary-row'}>
          <div className={'currency-display__input-wrapper'}>
            <input
              className={primaryBalanceClassName}
              value={valueToRender}
              placeholder={'0'}
              type={'number'}
              readOnly
              onChange={this.handleChange.bind(this)}
              onBlur={this.handleBlur.bind(this)}
              ref={input => {
                this.currencyInput = input
              }}
              style={{
                width: this.getInputWidth(valueToRender, readOnly),
              }}
              min={0}
              step={step}
            />
            <span className={'currency-display__currency-symbol'}>
              {primaryCurrency}
            </span>
          </div>
        </div>
        <div className={convertedBalanceClassName}>
          {convertedValueToRender} {convertedCurrency.toUpperCase()}
        </div>
      </div>
    )
  }

}
