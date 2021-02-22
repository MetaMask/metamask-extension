import { connect } from 'react-redux';
import {
  setCurrentCurrency,
  setUseBlockie,
  updateCurrentLocale,
  setUseNativeCurrencyAsPrimaryCurrencyPreference,
  setHideZeroBalanceTokens,
  setParticipateInMetaMetrics,
} from '../../../store/actions';
import { getPreferences } from '../../../selectors';
import SettingsTab from './settings-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    currentLocale,
  } = metamask;
  const {
    useNativeCurrencyAsPrimaryCurrency,
    hideZeroBalanceTokens,
  } = getPreferences(state);

  return {
    warning,
    currentLocale,
    currentCurrency,
    conversionDate,
    nativeCurrency,
    useBlockie,
    useNativeCurrencyAsPrimaryCurrency,
    hideZeroBalanceTokens,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentCurrency: (currency) => dispatch(setCurrentCurrency(currency)),
    setUseBlockie: (value) => dispatch(setUseBlockie(value)),
    updateCurrentLocale: (key) => dispatch(updateCurrentLocale(key)),
    setUseNativeCurrencyAsPrimaryCurrencyPreference: (value) => {
      return dispatch(setUseNativeCurrencyAsPrimaryCurrencyPreference(value));
    },
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setHideZeroBalanceTokens: (value) =>
      dispatch(setHideZeroBalanceTokens(value)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTab);
