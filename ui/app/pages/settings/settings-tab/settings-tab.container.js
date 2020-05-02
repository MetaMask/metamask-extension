import SettingsTab from './settings-tab.component'
import { connect } from 'react-redux'
import {
  setCurrentCurrency,
  setUseBlockie,
  updateCurrentLocale,
  setUseNativeCurrencyAsPrimaryCurrencyPreference,
  setParticipateInMetaMetrics,
} from '../../../store/actions'
import { preferencesSelector } from '../../../selectors'

const mapStateToProps = (state) => {
  const { appState: { warning }, metamask } = state
  const {
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    currentLocale,
  } = metamask
  const { useNativeCurrencyAsPrimaryCurrency } = preferencesSelector(state)

  return {
    warning,
    currentLocale,
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    useNativeCurrencyAsPrimaryCurrency,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentCurrency: (currency) => dispatch(setCurrentCurrency(currency)),
    setUseBlockie: (value) => dispatch(setUseBlockie(value)),
    updateCurrentLocale: (key) => dispatch(updateCurrentLocale(key)),
    setUseNativeCurrencyAsPrimaryCurrencyPreference: (value) => {
      return dispatch(setUseNativeCurrencyAsPrimaryCurrencyPreference(value))
    },
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTab)
