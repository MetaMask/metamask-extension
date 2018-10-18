import { connect } from 'react-redux'
import CurrencyDisplay from './currency-display.component'
import { getValueFromWeiHex, formatCurrency } from '../../helpers/confirm-transaction/util'

const mapStateToProps = state => {
  const { metamask: { fromCurrency, currentCurrency, conversionRate } } = state

  return {
    currentCurrency,
    conversionRate,
    fromCurrency,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { fromCurrency, currentCurrency, conversionRate, ...restStateProps } = stateProps
  const {
    value,
    numberOfDecimals = 2,
    currency,
    denomination,
    hideLabel,
    ...restOwnProps
  } = ownProps

  const toCurrency = currency === 'ETH' ? fromCurrency || currency : currency || currentCurrency
  const convertedValue = getValueFromWeiHex({
    value, fromCurrency, toCurrency, conversionRate, numberOfDecimals, toDenomination: denomination,
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
