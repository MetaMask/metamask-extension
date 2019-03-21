import { connect } from 'react-redux'
import CurrencyDisplay from './currency-display.component'
import { getValueFromWeiHex, formatCurrency } from '../../../helpers/utils/confirm-tx.util'

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
    displayValue: propsDisplayValue,
    suffix: propsSuffix,
    ...restOwnProps
  } = ownProps

  const toCurrency = currency || currentCurrency

  const displayValue = propsDisplayValue || formatCurrency(
    getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency, conversionRate,
      numberOfDecimals,
      toDenomination: denomination,
    }),
    toCurrency
  )
  const suffix = propsSuffix || (hideLabel ? undefined : toCurrency.toUpperCase())

  return {
    ...restStateProps,
    ...dispatchProps,
    ...restOwnProps,
    displayValue,
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyDisplay)
