import { connect } from 'react-redux'
import CurrencyInput from './currency-input.component'
import { ETH, XDAI } from '../../../helpers/constants/common'
import { getMaxModeOn } from '../../../pages/send/send-content/send-amount-row/amount-max-button/amount-max-button.selectors'
import {getIsMainnet, preferencesSelector} from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { metamask: { nativeCurrency, currentCurrency, conversionRate, ticker } } = state
  const { showFiatInTestnets } = preferencesSelector(state)
  const isMainnet = getIsMainnet(state)
  const maxModeOn = getMaxModeOn(state)

  return {
    nativeCurrency,
    currentCurrency,
    conversionRate,
    hideFiat: (!isMainnet && !showFiatInTestnets),
    maxModeOn,
    ticker,
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { nativeCurrency, currentCurrency, ticker } = stateProps
  let nativeSuffix = nativeCurrency
  if (ticker === XDAI) {
    nativeSuffix = ticker
  }
  return {
    ...stateProps,
    ...dispatchProps,
    ...ownProps,
    nativeSuffix: nativeSuffix || ETH,
    fiatSuffix: currentCurrency.toUpperCase(),
  }
}

export default connect(mapStateToProps, null, mergeProps)(CurrencyInput)
