import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import UnitInput from '../unit-input'
import CurrencyDisplay from '../currency-display'
import { getValueFromWeiHex, getWeiHexFromDecimalValue } from '../../helpers/conversions.util'
import { ETH } from '../../constants/common'

/**
 * Component that allows user to enter currency values as a number, and props receive a converted
 * hex value in WEI. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value depending on the currency (ETH or Fiat).
 */
export default class CurrencyInput extends PureComponent {
  static propTypes = {
    conversionRate: PropTypes.number,
    currentCurrency: PropTypes.string,
    nativeCurrency: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    suffix: PropTypes.string,
    useFiat: PropTypes.bool,
    value: PropTypes.string,
  }

  constructor (props) {
    super(props)

    const { value: hexValue } = props
    const decimalValue = hexValue ? this.getDecimalValue(props) : 0

    this.state = {
      decimalValue,
      hexValue,
    }
  }

  componentDidUpdate (prevProps) {
    const { value: prevPropsHexValue } = prevProps
    const { value: propsHexValue } = this.props
    const { hexValue: stateHexValue } = this.state

    if (prevPropsHexValue !== propsHexValue && propsHexValue !== stateHexValue) {
      const decimalValue = this.getDecimalValue(this.props)
      this.setState({ hexValue: propsHexValue, decimalValue })
    }
  }

  getDecimalValue (props) {
    const { value: hexValue, useFiat, currentCurrency, conversionRate } = props
    const decimalValueString = useFiat
      ? getValueFromWeiHex({
        value: hexValue, toCurrency: currentCurrency, conversionRate, numberOfDecimals: 2,
      })
      : getValueFromWeiHex({
        value: hexValue, toCurrency: ETH, numberOfDecimals: 6,
      })

    return Number(decimalValueString) || 0
  }

  handleChange = decimalValue => {
    const { useFiat, currentCurrency: fromCurrency, conversionRate, onChange } = this.props

    const hexValue = useFiat
      ? getWeiHexFromDecimalValue({
        value: decimalValue, fromCurrency, conversionRate, invertConversionRate: true,
      })
      : getWeiHexFromDecimalValue({
        value: decimalValue, fromCurrency: ETH, fromDenomination: ETH, conversionRate,
      })

    this.setState({ hexValue, decimalValue })
    onChange(hexValue)
  }

  handleBlur = () => {
    this.props.onBlur(this.state.hexValue)
  }

  renderConversionComponent () {
    const { useFiat, currentCurrency, nativeCurrency } = this.props
    const { hexValue } = this.state
    let currency, numberOfDecimals

    if (useFiat) {
      // Display ETH
      currency = nativeCurrency || ETH
      numberOfDecimals = 6
    } else {
      // Display Fiat
      currency = currentCurrency
      numberOfDecimals = 2
    }

    return (
      <CurrencyDisplay
        className="currency-input__conversion-component"
        currency={currency}
        value={hexValue}
        numberOfDecimals={numberOfDecimals}
      />
    )
  }

  render () {
    const { suffix, ...restProps } = this.props
    const { decimalValue } = this.state

    return (
      <UnitInput
        {...restProps}
        suffix={suffix}
        onChange={this.handleChange}
        onBlur={this.handleBlur}
        value={decimalValue}
      >
        { this.renderConversionComponent() }
      </UnitInput>
    )
  }
}
