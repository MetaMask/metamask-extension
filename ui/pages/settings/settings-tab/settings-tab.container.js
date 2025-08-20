import { connect } from 'react-redux';
import {
  setCurrentCurrency,
  setUseBlockie,
  updateCurrentLocale,
  setHideZeroBalanceTokens,
  setParticipateInMetaMetrics,
  setTheme,
  setShowNativeTokenAsMainBalancePreference,
} from '../../../store/actions';
import {
  getPreferences,
  getTheme,
  getSelectedInternalAccount,
} from '../../../selectors';
import { getProviderConfig } from '../../../../shared/modules/selectors/networks';
import SettingsTab from './settings-tab.component';

const mapStateToProps = (state) => {
  const { metamask } = state;
  const { currentCurrency, useBlockie, currentLocale } = metamask;
  const { ticker: nativeCurrency } = getProviderConfig(state);
  const { address: selectedAddress } = getSelectedInternalAccount(state);
  const { hideZeroBalanceTokens, showNativeTokenAsMainBalance } =
    getPreferences(state);

  return {
    currentLocale,
    currentCurrency,
    nativeCurrency,
    useBlockie,
    showNativeTokenAsMainBalance,
    hideZeroBalanceTokens,
    selectedAddress,
    theme: getTheme(state),
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
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(SettingsTab);
