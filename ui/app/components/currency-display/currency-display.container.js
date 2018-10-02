import { connect } from 'react-redux'
import CurrencyDisplay from './currency-display.component'
import { getValueFromWeiHex, formatCurrency } from '../../helpers/confirm-transaction/util'

const mapStateToProps = state => {
  const { metamask: { currentCurrency, conversionRate } } = state

  return {
    currentCurrency,
    conversionRate,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { currentCurrency, conversionRate, ...restStateProps } = stateProps
  const {
    value,
    numberOfDecimals = 2,
    currency,
    denomination,
    hideLabel,
    ...restOwnProps
  } = ownProps

  const toCurrency = currency || currentCurrency
  const convertedValue = getValueFromWeiHex({
    value, toCurrency, conversionRate, numberOfDecimals, toDenomination: denomination,
  })
  const formattedValue = formatCurrency(convertedValue, toCurrency)
  const displayValue = hideLabel ? formattedValue : `${formattedValue} ${toCurrency.toUpperCase()}`

  return {
    ...restStateProps,
    ...dispatchProps,
    ...restOwnProps,
    displayValue,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyDisplay)
