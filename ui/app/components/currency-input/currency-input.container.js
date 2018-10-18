import { connect } from 'react-redux'
import CurrencyInput from './currency-input.component'
import { ETH } from '../../constants/common'

const mapStateToProps = state => {
  const { metamask: { fromCurrency, currentCurrency, conversionRate } } = state

  return {
    fromCurrency,
    currentCurrency,
    conversionRate,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { fromCurrency, currentCurrency } = stateProps
  const { useFiat } = ownProps
  const suffix = useFiat ? currentCurrency.toUpperCase() : fromCurrency || ETH

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput)
