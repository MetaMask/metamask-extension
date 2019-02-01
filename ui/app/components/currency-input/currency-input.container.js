import { connect } from 'react-redux'
import CurrencyInput from './currency-input.component'
import { ETH } from '../../constants/common'

const mapStateToProps = state => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate } } = state

  return {
    nativeCurrency,
    currentCurrency,
    conversionRate,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, currentCurrency } = stateProps
  const { useFiat } = ownProps
  const suffix = useFiat ? currentCurrency.toUpperCase() : nativeCurrency || ETH

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    nativeSuffix: nativeCurrency || ETH,
    fiatSuffix: currentCurrency.toUpperCase(),
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput)
