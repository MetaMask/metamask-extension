import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import UnitInput from '../unit-input'
import CurrencyDisplay from '../currency-display'
import { getWeiHexFromDecimalValue } from '../../../helpers/utils/conversions.util'
import ethUtil from 'ethereumjs-util'
import { conversionUtil, multiplyCurrencies } from '../../../helpers/utils/conversion-util'
import { ETH } from '../../../helpers/constants/common'

/**
 * Component that allows user to enter token values as a number, and props receive a converted
 * hex value. props.value, used as a default or forced value, should be a hex value, which
 * gets converted into a decimal value.
 */
export default class TokenInput extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    currentCurrency: PropTypes.string,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    value: PropTypes.string,
    suffix: PropTypes.string,
    showFiat: PropTypes.bool,
    hideConversion: PropTypes.bool,
    selectedToken: PropTypes.object,
    selectedTokenExchangeRate: PropTypes.number,
  }

  constructor (props) {
    super(props)

    const { value: hexValue } = props
    const decimalValue = hexValue ? this.getValue(props) : 0

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
      const decimalValue = this.getValue(this.props)
      this.setState({ hexValue: propsHexValue, decimalValue })
    }
  }

  getValue (props) {
    const { value: hexValue, selectedToken: { decimals, symbol } = {} } = props

    const multiplier = Math.pow(10, Number(decimals || 0))
    const decimalValueString = conversionUtil(ethUtil.addHexPrefix(hexValue), {
      fromNumericBase: 'hex',
      toNumericBase: 'dec',
      toCurrency: symbol,
      conversionRate: multiplier,
      invertConversionRate: true,
    })

    return Number(decimalValueString) ? decimalValueString : ''
  }

  handleChange = decimalValue => {
    const { selectedToken: { decimals } = {}, onChange } = this.props

    const multiplier = Math.pow(10, Number(decimals || 0))
    const hexValue = multiplyCurrencies(decimalValue || 0, multiplier, { toNumericBase: 'hex' })

    this.setState({ hexValue, decimalValue })
    onChange(hexValue)
  }

  handleBlur = () => {
    this.props.onBlur(this.state.hexValue)
  }

  renderConversionComponent () {
    const { selectedTokenExchangeRate, showFiat, currentCurrency, hideConversion } = this.props
    const { decimalValue } = this.state
    let currency, numberOfDecimals

    if (hideConversion) {
      return (
        <div className="currency-input__conversion-component">
          { this.context.t('noConversionRateAvailable') }
        </div>
      )
    }

    if (showFiat) {
      // Display Fiat
      currency = currentCurrency
      numberOfDecimals = 2
    } else {
      // Display ETH
      currency = ETH
      numberOfDecimals = 6
    }

    const decimalEthValue = (decimalValue * selectedTokenExchangeRate) || 0
    const hexWeiValue = getWeiHexFromDecimalValue({
      value: decimalEthValue,
      fromCurrency: ETH,
      fromDenomination: ETH,
    })

    return selectedTokenExchangeRate
      ? (
        <CurrencyDisplay
          className="currency-input__conversion-component"
          currency={currency}
          value={hexWeiValue}
          numberOfDecimals={numberOfDecimals}
        />
      ) : (
        <div className="currency-input__conversion-component">
          { this.context.t('noConversionRateAvailable') }
        </div>
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
