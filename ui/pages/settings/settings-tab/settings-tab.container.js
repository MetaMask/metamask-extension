import { connect } from 'react-redux';
import {
  setCurrentCurrency,
  setUseBlockie,
  updateCurrentLocale,
  setUseNativeCurrencyAsPrimaryCurrencyPreference,
  setHideZeroBalanceTokens,
  setParticipateInMetaMetrics,
  setTheme,
} from '../../../store/actions';
import { getPreferences, getTheme } from '../../../selectors';
import SettingsTab from './settings-tab.component';

const mapStateToProps = (state, ownProps) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const {
    currentCurrency,
    nativeCurrency,
    useBlockie,
    currentLocale,
    selectedAddress,
    useTokenDetection,
    tokenList,
  } = metamask;
  const {
    useNativeCurrencyAsPrimaryCurrency,
    hideZeroBalanceTokens,
  } = getPreferences(state);

  const { lastFetchedConversionDate } = ownProps;

  return {
    warning,
    currentLocale,
    currentCurrency,
    nativeCurrency,
    useBlockie,
    useNativeCurrencyAsPrimaryCurrency,
    hideZeroBalanceTokens,
    lastFetchedConversionDate,
    selectedAddress,
    useTokenDetection,
    tokenList,
    theme: getTheme(state),
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
    setTheme: (val) => dispatch(setTheme(val)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTab);
