import { connect } from 'react-redux';
import {
  setCurrentCurrency,
  setUseBlockie,
  updateCurrentLocale,
  setHideZeroBalanceTokens,
  setParticipateInMetaMetrics,
  setTheme,
  setShowNativeTokenAsMainBalancePreference,
  setAggregatedBalancePopover,
} from '../../../store/actions';
import {
  getTokenList,
  getPreferences,
  getTheme,
  getSelectedInternalAccount,
  getShouldShowAggregatedBalancePopover,
} from '../../../selectors';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import SettingsTab from './settings-tab.component';

const mapStateToProps = (state) => {
  const {
    appState: { warning },
    metamask,
  } = state;
  const { currentCurrency, useBlockie, currentLocale } = metamask;
  const { ticker: nativeCurrency } = getProviderConfig(state);
  const shouldShowAggregatedBalancePopover =
    getShouldShowAggregatedBalancePopover(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { hideZeroBalanceTokens, showNativeTokenAsMainBalance } =
    getPreferences(state);

  const tokenList = getTokenList(state);

  return {
    warning,
    currentLocale,
    currentCurrency,
    nativeCurrency,
    useBlockie,
    showNativeTokenAsMainBalance,
    hideZeroBalanceTokens,
    selectedAddress,
    tokenList,
    theme: getTheme(state),
    shouldShowAggregatedBalancePopover,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentCurrency: (currency) => dispatch(setCurrentCurrency(currency)),
    setUseBlockie: (value) => dispatch(setUseBlockie(value)),
    updateCurrentLocale: (key) => dispatch(updateCurrentLocale(key)),
    setShowNativeTokenAsMainBalancePreference: (value) => {
      return dispatch(setShowNativeTokenAsMainBalancePreference(value));
    },
    setParticipateInMetaMetrics: (val) =>
      dispatch(setParticipateInMetaMetrics(val)),
    setHideZeroBalanceTokens: (value) =>
      dispatch(setHideZeroBalanceTokens(value)),
    setTheme: (val) => dispatch(setTheme(val)),
    hideAggregatedBalancePopover: () => dispatch(setAggregatedBalancePopover()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTab);
