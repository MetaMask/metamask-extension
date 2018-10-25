import { connect } from 'react-redux'
import CurrencyDisplay from './currency-display.component'
import { getValueFromWeiHex, formatCurrency } from '../../helpers/confirm-transaction/util'

const mapStateToProps = state => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate } } = state

  return {
    currentCurrency,
    conversionRate,
    nativeCurrency,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, currentCurrency, conversionRate, ...restStateProps } = stateProps
  const {
    value,
    numberOfDecimals = 2,
    currency,
    denomination,
    hideLabel,
    ...restOwnProps
  } = ownProps

  const toCurrency = currency === 'ETH' ? nativeCurrency || currency : currency || currentCurrency
  const convertedValue = getValueFromWeiHex({
    value, nativeCurrency, toCurrency, conversionRate, numberOfDecimals, toDenomination: denomination,
  })
  const displayValue = formatCurrency(convertedValue, toCurrency)
  const suffix = hideLabel ? undefined : toCurrency.toUpperCase()

  return {
    ...restStateProps,
    ...dispatchProps,
    ...restOwnProps,
    displayValue,
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyDisplay)
