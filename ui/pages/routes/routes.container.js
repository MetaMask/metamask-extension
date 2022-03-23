import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getNetworkIdentifier,
  getPreferences,
  isNetworkLoading,
  getTheme,
} from '../../selectors';
import {
  lockMetamask,
  setCurrentCurrency,
  setLastActiveTime,
  setMouseUserState,
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import { prepareToLeaveSwaps } from '../../ducks/swaps/swaps';
import { getSendStage } from '../../ducks/send';
import Routes from './routes.component';

function mapStateToProps(state) {
  const { appState } = state;
  const { alertOpen, alertMessage, isLoading, loadingMessage } = appState;
  const { autoLockTimeLimit = 0 } = getPreferences(state);

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
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Routes);
