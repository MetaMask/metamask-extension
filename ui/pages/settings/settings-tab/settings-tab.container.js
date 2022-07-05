import { connect } from 'react-redux';
import {
  setCurrentCurrency,
  setUseBlockie,
  updateCurrentLocale,
  setUseNativeCurrencyAsPrimaryCurrencyPreference,
  setHideZeroBalanceTokens,
  setParticipateInMetaMetrics,
} from '../../../store/actions';
import {
  getIsTokenDetectionInactiveOnMainnet,
  getPreferences,
} from '../../../selectors';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../../shared/constants/tokens';
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
    tokenList,
  } = metamask;
  const { useNativeCurrencyAsPrimaryCurrency, hideZeroBalanceTokens } =
    getPreferences(state);

  const { lastFetchedConversionDate } = ownProps;
  const isTokenDetectionInactiveOnMainnet = getIsTokenDetectionInactiveOnMainnet(
    state,
  );
  const caseInSensitiveTokenList = isTokenDetectionInactiveOnMainnet
    ? STATIC_MAINNET_TOKEN_LIST
    : tokenList;

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
    isTokenDetectionInactiveOnMainnet,
    caseInSensitiveTokenList,
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
