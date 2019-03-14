import { connect } from 'react-redux'
import CurrencyInput from './currency-input.component'
import { ETH } from '../../helpers/constants/common'
import {getIsMainnet, preferencesSelector} from '../../selectors'

const mapStateToProps = state => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate } } = state
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)

  return {
    nativeCurrency,
    currentCurrency,
    conversionRate,
    hideFiat: (!isMainnet && !showFiatInTestnets),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, currentCurrency } = stateProps

  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    nativeSuffix: nativeCurrency || ETH,
    fiatSuffix: currentCurrency.toUpperCase(),
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput)
