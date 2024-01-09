import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  getAllAccountsOnNetworkAreEmpty,
  getIsNetworkUsed,
  getNetworkIdentifier,
  getPreferences,
  isNetworkLoading,
  getTheme,
  getIsTestnet,
  getCurrentChainId,
  getShouldShowSeedPhraseReminder,
  isCurrentProviderCustom,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  getUnapprovedConfirmations,
  ///: END:ONLY_INCLUDE_IF
} from '../../selectors';
import {
  lockMetamask,
  hideImportNftsModal,
  hideIpfsModal,
  setCurrentCurrency,
  setLastActiveTime,
  toggleAccountMenu,
  toggleNetworkMenu,
  hideImportTokensModal,
  ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
  hideKeyringRemovalResultModal,
  ///: END:ONLY_INCLUDE_IF
} from '../../store/actions';
import { hideSelectActionModal } from '../../components/multichain/app-footer/app-footer-actions';
import { pageChanged } from '../../ducks/history/history';
import { prepareToLeaveSwaps } from '../../ducks/swaps/swaps';
import { getSendStage } from '../../ducks/send';
import {
  getIsUnlocked,
  getProviderConfig,
} from '../../ducks/metamask/metamask';
import { DEFAULT_AUTO_LOCK_TIME_LIMIT } from '../../../shared/constants/preferences';
import Routes from './routes.component';

function mapStateToProps(state) {
  const { appState } = state;
  const { alertOpen, alertMessage, isLoading, loadingMessage } = appState;
  const { autoLockTimeLimit = DEFAULT_AUTO_LOCK_TIME_LIMIT } =
    getPreferences(state);
  const { completedOnboarding } = state.metamask;

  return {
    alertOpen,
    alertMessage,
    textDirection: state.metamask.textDirection,
    isLoading,
    loadingMessage,
    isUnlocked: getIsUnlocked(state),
    isNetworkLoading: isNetworkLoading(state),
    currentCurrency: state.metamask.currentCurrency,
    autoLockTimeLimit,
    browserEnvironmentOs: state.metamask.browserEnvironment?.os,
    browserEnvironmentContainter: state.metamask.browserEnvironment?.browser,
    providerId: getNetworkIdentifier(state),
    providerType: getProviderConfig(state).type,
    theme: getTheme(state),
    sendStage: getSendStage(state),
    isNetworkUsed: getIsNetworkUsed(state),
    allAccountsOnNetworkAreEmpty: getAllAccountsOnNetworkAreEmpty(state),
    isTestNet: getIsTestnet(state),
    currentChainId: getCurrentChainId(state),
    shouldShowSeedPhraseReminder: getShouldShowSeedPhraseReminder(state),
    forgottenPassword: state.metamask.forgottenPassword,
    isCurrentProviderCustom: isCurrentProviderCustom(state),
    completedOnboarding,
    isAccountMenuOpen: state.metamask.isAccountMenuOpen,
    isNetworkMenuOpen: state.metamask.isNetworkMenuOpen,
    isImportTokensModalOpen: state.appState.importTokensModalOpen,
    accountDetailsAddress: state.appState.accountDetailsAddress,
    isImportNftsModalOpen: state.appState.importNftsModal.open,
    isIpfsModalOpen: state.appState.showIpfsModalOpen,
    isSelectActionModalOpen: state.appState.showSelectActionModal,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    isShowKeyringSnapRemovalResultModal:
      state.appState.showKeyringRemovalSnapModal,
    pendingConfirmations: getUnapprovedConfirmations(state),
    ///: END:ONLY_INCLUDE_IF
  };
}

function mapDispatchToProps(dispatch) {
  return {
    lockMetaMask: () => dispatch(lockMetamask(false)),
    setCurrentCurrencyToUSD: () => dispatch(setCurrentCurrency('usd')),
    setLastActiveTime: () => dispatch(setLastActiveTime()),
    pageChanged: (path) => dispatch(pageChanged(path)),
    prepareToLeaveSwaps: () => dispatch(prepareToLeaveSwaps()),
    toggleAccountMenu: () => dispatch(toggleAccountMenu()),
    toggleNetworkMenu: () => dispatch(toggleNetworkMenu()),
    hideImportNftsModal: () => dispatch(hideImportNftsModal()),
    hideIpfsModal: () => dispatch(hideIpfsModal()),
    hideImportTokensModal: () => dispatch(hideImportTokensModal()),
    hideSelectActionModal: () => dispatch(hideSelectActionModal()),
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    hideShowKeyringSnapRemovalResultModal: () =>
      dispatch(hideKeyringRemovalResultModal()),
    ///: END:ONLY_INCLUDE_IF
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Routes);
