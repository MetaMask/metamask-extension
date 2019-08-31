import SettingsTab from './settings-tab.component'
import { compose } from 'recompose'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
  setCurrentCurrency,
  displayWarning,
  setUseBlockie,
  setUseNonceField,
  updateCurrentLocale,
  setUseNativeCurrencyAsPrimaryCurrencyPreference,
  setParticipateInMetaMetrics,
} from '../../../store/actions'
import { preferencesSelector } from '../../../selectors/selectors'

const mapStateToProps = state => {
  const { appState: { warning }, metamask } = state
  const {
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    useNonceField,
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
    useNonceField,
    useNativeCurrencyAsPrimaryCurrency,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    setCurrentCurrency: currency => dispatch(setCurrentCurrency(currency)),
    displayWarning: warning => dispatch(displayWarning(warning)),
    setUseBlockie: value => dispatch(setUseBlockie(value)),
    setUseNonceField: value => dispatch(setUseNonceField(value)),
    updateCurrentLocale: key => dispatch(updateCurrentLocale(key)),
    setUseNativeCurrencyAsPrimaryCurrencyPreference: value => {
      return dispatch(setUseNativeCurrencyAsPrimaryCurrencyPreference(value))
    },
    setParticipateInMetaMetrics: (val) => dispatch(setParticipateInMetaMetrics(val)),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(SettingsTab)
