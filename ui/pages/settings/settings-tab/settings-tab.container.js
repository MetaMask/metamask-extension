import { connect } from 'react-redux';
import {
  setCurrentCurrency,
  setAvatarType,
  updateCurrentLocale,
  setHideZeroBalanceTokens,
  setParticipateInMetaMetrics,
  setTheme,
  setShowNativeTokenAsMainBalancePreference,
} from '../../../store/actions';
import {
  getTokenList,
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
  const { hideZeroBalanceTokens, showNativeTokenAsMainBalance, avatarType } =
    getPreferences(state);

  const tokenList = getTokenList(state);

  return {
    currentLocale,
    currentCurrency,
    nativeCurrency,
    useBlockie,
    avatarType,
    showNativeTokenAsMainBalance,
    hideZeroBalanceTokens,
    selectedAddress,
    tokenList,
    theme: getTheme(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    setCurrentCurrency: (currency) => dispatch(setCurrentCurrency(currency)),
    setAvatarType: (value) => dispatch(setAvatarType(value)),
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
