import { connect } from 'react-redux'
import CurrencyInput from './currency-input.component'
import { ETH } from '../../../helpers/constants/common'
import { getMaxModeOn } from '../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.selectors'
import {getIsMainnet, preferencesSelector} from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate } } = state
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const maxModeOn = getMaxModeOn(state)

  return {
    nativeCurrency,
    currentCurrency,
    conversionRate,
    hideFiat: (!isMainnet && !showFiatInTestnets),
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
