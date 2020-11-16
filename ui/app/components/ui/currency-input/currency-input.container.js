import { connect } from 'react-redux'
import { ETH } from '../../../helpers/constants/common'
import {
  getSendMaxModeState,
  getIsMainnet,
  getPreferences,
} from '../../../selectors'
import CurrencyInput from './currency-input.component'

const mapStateToProps = (state) => {
  const {
    metamask: { nativeCurrency, currentCurrency, conversionRate },
  } = state
  const { showFiatInTestnets } = getPreferences(state)
  const isMainnet = getIsMainnet(state)
  const maxModeOn = getSendMaxModeState(state)

  return {
    nativeCurrency,
    currentCurrency,
    conversionRate,
    hideFiat: !isMainnet && !showFiatInTestnets,
    maxModeOn,
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
