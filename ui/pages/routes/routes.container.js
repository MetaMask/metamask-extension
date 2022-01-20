import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getMetaMaskCachedBalances,
  getNetworkIdentifier,
  getPreferences,
  getProvider,
  getUseTokenDetection,
  hasAnyFundsOnNetwork,
  isNetworkLoading,
  getTheme,
} from '../../selectors';
import {
  lockMetamask,
  setCurrentCurrency,
  setLastActiveTime,
  setMouseUserState,
  setShowPopup,
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import { prepareToLeaveSwaps } from '../../ducks/swaps/swaps';
import { getSendStage } from '../../ducks/send';
import Routes from './routes.component';

function mapStateToProps(state) {
  const { appState } = state;
  const { alertOpen, alertMessage, isLoading, loadingMessage } = appState;
  const { autoLockTimeLimit = 0 } = getPreferences(state);

  const autoDetectToken = getUseTokenDetection(state);

  const fundsOnNetwork = getMetaMaskCachedBalances(state) ?? {};
  const hasNoFundsOnNetwork = Object.values(fundsOnNetwork).includes('0x0') ?? false;

  fetch('https://token-api.metaswap.codefi.network/tokens/xxx}').then((res) => console.log(res));

  // const a = getProvider(state);
  // console.log(a);

  return {
    alertOpen,
    alertMessage,
    textDirection: state.metamask.textDirection,
    isLoading,
    loadingMessage,
    isUnlocked: state.metamask.isUnlocked,
    isNetworkLoading: isNetworkLoading(state),
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    autoLockTimeLimit,
    browserEnvironmentOs: state.metamask.browserEnvironment?.os,
    browserEnvironmentContainter: state.metamask.browserEnvironment?.browser,
    providerId: getNetworkIdentifier(state),
    providerType: state.metamask.provider?.type,
    theme: getTheme(state),
    sendStage: getSendStage(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    lockMetaMask: () => dispatch(lockMetamask(false)),
    setCurrentCurrencyToUSD: () => dispatch(setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) =>
      dispatch(setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(setLastActiveTime()),
    pageChanged: (path) => dispatch(pageChanged(path)),
    prepareToLeaveSwaps: () => dispatch(prepareToLeaveSwaps()),
    setShowPopup: () => setShowPopup(),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Routes);
