import { connect } from 'react-redux'
import CurrencyDisplay from './currency-display.component'
import { getValueFromWeiHex, formatCurrency } from '../../../helpers/utils/confirm-tx.util'
import { GWEI, SECONDARY, XDAI } from '../../../helpers/constants/common'

const mapStateToProps = state => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate, ticker } } = state

  return {
    currentCurrency,
    conversionRate,
    nativeCurrency,
    ticker,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, currentCurrency, conversionRate, ticker, ...restStateProps } = stateProps
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

  const currencyCode = ticker === XDAI ? ticker : toCurrency
  const displayValue = propsDisplayValue || formatCurrency(
    getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency, conversionRate,
      numberOfDecimals,
      toDenomination: denomination,
    }),
    currencyCode
  )
  let suffix = propsSuffix || (hideLabel ? undefined : toCurrency.toUpperCase())
  if (ticker === XDAI &&
    toCurrency === 'usd' &&
    ownProps.className &&
    (ownProps.className.includes('primary') ||
      (ownProps.className.includes('transaction-breakdown__value') && denomination !== GWEI && ownProps.type !== SECONDARY) ||
      ownProps.className === 'token-amount'
    )
  ) {
    suffix = ticker
  }

  return {
    ...restStateProps,
    ...dispatchProps,
    ...restOwnProps,
    displayValue,
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyDisplay)
