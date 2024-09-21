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
import {
  getTokenList,
  getPreferences,
  getTheme,
  getSelectedInternalAccount,
} from '../../../selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import SettingsTab from './settings-tab.component';

const mapStateToProps = (state, ownProps) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const { currentCurrency, useBlockie, currentLocale } = metamask;
  const { ticker: nativeCurrency } = getProviderConfig(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { useNativeCurrencyAsPrimaryCurrency, hideZeroBalanceTokens } =
    getPreferences(state);

  const { lastFetchedConversionDate } = ownProps;
  const tokenList = getTokenList(state);

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
