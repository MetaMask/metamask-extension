import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import CurrencyDisplay from './currency-display.component'
import { getValueFromWeiHex, formatCurrency } from '../../../helpers/utils/confirm-tx.util'
import { GWEI } from '../../../helpers/constants/common'

const mapStateToProps = (state) => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate } } = state

  return {
    currentCurrency,
    conversionRate,
    nativeCurrency,
  }
}

const mergeProps = (stateProps, _, ownProps) => {
  const { nativeCurrency, currentCurrency, conversionRate } = stateProps
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
    ...restOwnProps,
    displayValue,
    suffix,
  }
}

const CurrencyDisplayContainer = connect(mapStateToProps, null, mergeProps)(CurrencyDisplay)

CurrencyDisplayContainer.propTypes = {
  className: PropTypes.string,
  currency: PropTypes.string,
  denomination: PropTypes.oneOf([GWEI]),
  displayValue: PropTypes.string,
  hideLabel: PropTypes.bool,
  hideTitle: PropTypes.bool,
  numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  prefix: PropTypes.string,
  prefixComponent: PropTypes.node,
  style: PropTypes.object,
  suffix: PropTypes.string,
  value: PropTypes.string,
}

export default CurrencyDisplayContainer
