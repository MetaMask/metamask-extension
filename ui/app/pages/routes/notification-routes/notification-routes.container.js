import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { compose } from 'recompose'

import actions from '../../../store/actions'
import { preferencesSelector } from '../../../selectors/selectors'

import { getLoadMessage, isLoadingNetwork } from '../routes.selectors'
import NotificationRoutes from './notification-routes.component'

function mapStateToProps (state) {
  const { appState, metamask } = state
  const {
    alertOpen,
    alertMessage,
    isLoading,
  } = appState
  const { autoLogoutTimeLimit = 0 } = preferencesSelector(state)

  const {
    currentCurrency,
    frequentRpcListDetail = [],
  } = metamask

  return {
    alertMessage,
    alertOpen,
    autoLogoutTimeLimit,
    currentCurrency,
    frequentRpcListDetail,
    isLoading,
    isLoadingNetwork: isLoadingNetwork(state),
    loadMessage: getLoadMessage(state),
  }
}

function mapDispatchToProps (dispatch) {
  return {
    setCurrentCurrencyToUSD: () => dispatch(actions.setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) => dispatch(actions.setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(actions.setLastActiveTime()),
  }
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NotificationRoutes)
