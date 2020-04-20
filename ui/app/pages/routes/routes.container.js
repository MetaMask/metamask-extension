import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'redux'
import {
  getNetworkIdentifier,
  hasPermissionRequests,
  preferencesSelector,
} from '../../selectors/selectors'
import { submittedPendingTransactionsSelector } from '../../selectors/transactions'
import Routes from './routes.component'
import {
  hideSidebar,
  lockMetamask,
  setCurrentCurrency,
  setLastActiveTime,
  setMouseUserState,
} from '../../store/actions'

function mapStateToProps (state) {
  const { appState } = state
  const {
    sidebar,
    alertOpen,
    alertMessage,
    isLoading,
    loadingMessage,
  } = appState
  const { autoLockTimeLimit = 0 } = preferencesSelector(state)

  return {
    sidebar,
    alertOpen,
    alertMessage,
    textDirection: state.metamask.textDirection,
    isLoading,
    loadingMessage,
    isUnlocked: state.metamask.isUnlocked,
    submittedPendingTransactions: submittedPendingTransactionsSelector(state),
    network: state.metamask.network,
    provider: state.metamask.provider,
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    providerId: getNetworkIdentifier(state),
    autoLockTimeLimit,
    hasPermissionsRequests: hasPermissionRequests(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    lockMetaMask: () => dispatch(lockMetamask(false)),
    hideSidebar: () => dispatch(hideSidebar()),
    setCurrentCurrencyToUSD: () => dispatch(setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) => dispatch(setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(setLastActiveTime()),
  }
}

export default compose(withRouter, connect(mapStateToProps, mapDispatchToProps))(Routes)
