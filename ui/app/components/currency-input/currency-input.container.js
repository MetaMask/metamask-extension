import { connect } from 'react-redux'
import CurrencyInput from './currency-input.component'
import { ETH } from '../../constants/common'

const mapStateToProps = state => {
  const { metamask: { currentCurrency, conversionRate } } = state

  return {
    currentCurrency,
    conversionRate,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { currentCurrency } = stateProps
  const { useFiat } = ownProps
  const suffix = useFiat ? currentCurrency.toUpperCase() : ETH

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    suffix,
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput)
