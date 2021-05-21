import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getNetworkIdentifier,
  getPreferences,
  isNetworkLoading,
  submittedPendingTransactionsSelector,
} from '../../selectors';
import {
  hideSidebar,
  lockMetamask,
  setCurrentCurrency,
  setLastActiveTime,
  setMouseUserState,
} from '../../store/actions';
import { pageChanged } from '../../ducks/history/history';
import { prepareToLeaveSwaps } from '../../ducks/swaps/swaps';
import Routes from './routes.component';

function mapStateToProps(state) {
  const { appState } = state;
  const {
    sidebar,
    alertOpen,
    alertMessage,
    isLoading,
    loadingMessage,
  } = appState;
  const { autoLockTimeLimit = 0 } = getPreferences(state);

  return {
    sidebar,
    alertOpen,
    alertMessage,
    textDirection: state.metamask.textDirection,
    isLoading,
    loadingMessage,
    isUnlocked: state.metamask.isUnlocked,
    submittedPendingTransactions: submittedPendingTransactionsSelector(state),
    isNetworkLoading: isNetworkLoading(state),
    provider: state.metamask.provider,
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    providerId: getNetworkIdentifier(state),
    autoLockTimeLimit,
    browserEnvironment: state.metamask.browserEnvironment,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    lockMetaMask: () => dispatch(lockMetamask(false)),
    hideSidebar: () => dispatch(hideSidebar()),
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
