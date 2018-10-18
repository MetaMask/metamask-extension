import { connect } from 'react-redux'
import UserPreferencedCurrencyDisplay from './user-preferenced-currency-display.component'
import { preferencesSelector } from '../../selectors'
import { ETH, PRIMARY, SECONDARY } from '../../constants/common'

const mapStateToProps = (state, ownProps) => {
  const { useETHAsPrimaryCurrency } = preferencesSelector(state)

  return {
    useETHAsPrimaryCurrency,
    fromCurrency: state.metamask.fromCurrency,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { useETHAsPrimaryCurrency, fromCurrency, ...restStateProps } = stateProps
  const {
    type,
    numberOfDecimals: propsNumberOfDecimals,
    ethNumberOfDecimals,
    fiatNumberOfDecimals,
    ethPrefix,
    fiatPrefix,
    prefix: propsPrefix,
    ...restOwnProps
  } = ownProps

  let currency, numberOfDecimals, prefix

  if (type === PRIMARY && useETHAsPrimaryCurrency ||
    type === SECONDARY && !useETHAsPrimaryCurrency) {
    // Display ETH
    currency = fromCurrency || ETH
    numberOfDecimals = propsNumberOfDecimals || ethNumberOfDecimals || 6
    prefix = propsPrefix || ethPrefix
  } else if (type === SECONDARY && useETHAsPrimaryCurrency ||
    type === PRIMARY && !useETHAsPrimaryCurrency) {
    // Display Fiat
    numberOfDecimals = propsNumberOfDecimals || fiatNumberOfDecimals || 2
    prefix = propsPrefix || fiatPrefix
  }

  return {
    ...restStateProps,
    ...dispatchProps,
    ...restOwnProps,
    fromCurrency,
    currency,
    numberOfDecimals,
    prefix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(UserPreferencedCurrencyDisplay)
