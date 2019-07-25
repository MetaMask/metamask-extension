import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Route, Switch, withRouter } from 'react-router-dom'
import { compose } from 'recompose'
import actions from '../../store/actions'
import IdleTimer from 'react-idle-timer'
import {getMetaMaskAccounts, getNetworkIdentifier, preferencesSelector} from '../../selectors/selectors'

// accounts
const SendTransactionScreen = require('../send/send.container')
const ConfirmTransaction = require('../confirm-transaction')

// other views
import NotificationHome from '../notification-home'
import ConfirmAddSuggestedTokenPage from '../confirm-add-suggested-token'

// import Settings from '../settings'
import Authenticated from '../../helpers/higher-order-components/authenticated'
import Initialized from '../../helpers/higher-order-components/initialized'
import Lock from '../lock'

const Loading = require('../../components/ui/loading-screen')
const LoadingNetwork = require('../../components/app/loading-network-screen').default
const NetworkDropdown = require('../../components/app/dropdowns/network-dropdown')

// Global Modals
const Modal = require('../../components/app/modals').Modal
// Global Alert
const Alert = require('../../components/ui/alert')

import UnlockPage from '../unlock-page'

// Routes
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  UNLOCK_ROUTE,
  SEND_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
} from '../../helpers/constants/routes'

class NotificationRoutes extends Component {
  componentWillMount () {
    const { currentCurrency, setCurrentCurrencyToUSD } = this.props

    if (!currentCurrency) {
      setCurrentCurrencyToUSD()
    }

    this.props.history.listen((locationObj, action) => {
      if (action === 'PUSH') {
        const url = `&url=${encodeURIComponent('http://www.metamask.io/metametrics' + locationObj.pathname)}`
        this.context.metricsEvent({}, {
          currentPath: '',
          pathname: locationObj.pathname,
          url,
          pageOpts: {
            hideDimensions: true,
          },
        })
      }
    })
  }

  renderRoutes () {
    const { autoLogoutTimeLimit, setLastActiveTime } = this.props

    const routes = (
      <Switch>
        <Route path={LOCK_ROUTE} component={Lock} exact />
        <Initialized path={UNLOCK_ROUTE} component={UnlockPage} exact />
        <Authenticated path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`} component={ConfirmTransaction} />
        <Authenticated path={SEND_ROUTE} component={SendTransactionScreen} exact />
        <Authenticated path={CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE} component={ConfirmAddSuggestedTokenPage} exact />
        <Authenticated path={DEFAULT_ROUTE} component={NotificationHome} exact />
      </Switch>
    )

    if (autoLogoutTimeLimit > 0) {
      return (
        <IdleTimer onAction={setLastActiveTime} throttle={1000}>
          {routes}
        </IdleTimer>
      )
    }

    return routes
  }

  render () {
    const {
      isLoading,
      alertMessage,
      loadingMessage,
      network,
      provider,
      frequentRpcListDetail,
      currentView,
      setMouseUserState,
    } = this.props
    const isLoadingNetwork = network === 'loading' && currentView.name !== 'config'
    const loadMessage = loadingMessage || isLoadingNetwork ?
      this.getConnectingLabel(loadingMessage) : null

    return (
      <div
        className="app"
        onClick={() => setMouseUserState(true)}
        onKeyDown={e => {
          if (e.keyCode === 9) {
            setMouseUserState(false)
          }
        }}
      >
        <Modal />
        <Alert
          visible={this.props.alertOpen}
          msg={alertMessage}
        />
        <NetworkDropdown
          provider={provider}
          frequentRpcListDetail={frequentRpcListDetail}
        />
        <div className="main-container-wrapper">
          { isLoading && <Loading loadingMessage={loadMessage} /> }
          { !isLoading && isLoadingNetwork && <LoadingNetwork /> }
          { this.renderRoutes() }
        </div>
      </div>
    )
  }

  getConnectingLabel = function (loadingMessage) {
    if (loadingMessage) {
      return loadingMessage
    }
    const { provider, providerId } = this.props
    const providerName = provider.type

    let name

    if (providerName === 'mainnet') {
      name = this.context.t('connectingToMainnet')
    } else if (providerName === 'ropsten') {
      name = this.context.t('connectingToRopsten')
    } else if (providerName === 'kovan') {
      name = this.context.t('connectingToKovan')
    } else if (providerName === 'rinkeby') {
      name = this.context.t('connectingToRinkeby')
    } else if (providerName === 'localhost') {
      name = this.context.t('connectingToLocalhost')
    } else if (providerName === 'goerli') {
      name = this.context.t('connectingToGoerli')
    } else {
      name = this.context.t('connectingTo', [providerId])
    }

    return name
  }
}

NotificationRoutes.propTypes = {
  currentCurrency: PropTypes.string,
  setCurrentCurrencyToUSD: PropTypes.func,
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  alertMessage: PropTypes.string,
  network: PropTypes.string,
  provider: PropTypes.object,
  frequentRpcListDetail: PropTypes.array,
  currentView: PropTypes.object,
  alertOpen: PropTypes.bool,
  hideSidebar: PropTypes.func,
  isOnboarding: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  networkDropdownOpen: PropTypes.bool,
  hideNetworkDropdown: PropTypes.func,
  setLastActiveTime: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  selectedAddress: PropTypes.string,
  lostAccounts: PropTypes.array,
  isInitialized: PropTypes.bool,
  forgottenPassword: PropTypes.bool,
  activeAddress: PropTypes.string,
  unapprovedTxs: PropTypes.object,
  seedWords: PropTypes.string,
  unapprovedMsgCount: PropTypes.number,
  unapprovedPersonalMsgCount: PropTypes.number,
  unapprovedTypedMessagesCount: PropTypes.number,
  welcomeScreenSeen: PropTypes.bool,
  isPopup: PropTypes.bool,
  isMouseUser: PropTypes.bool,
  setMouseUserState: PropTypes.func,
  t: PropTypes.func,
  providerId: PropTypes.string,
  providerRequests: PropTypes.array,
  autoLogoutTimeLimit: PropTypes.number,
}

function mapStateToProps (state) {
  const { appState, metamask } = state
  const {
    networkDropdownOpen,
    alertOpen,
    alertMessage,
    isLoading,
    loadingMessage,
  } = appState

  const accounts = getMetaMaskAccounts(state)
  const { autoLogoutTimeLimit = 0 } = preferencesSelector(state)

  const {
    identities,
    address,
    keyrings,
    isInitialized,
    seedWords,
    unapprovedTxs,
    lostAccounts,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
    providerRequests,
  } = metamask
  const selected = address || Object.keys(accounts)[0]

  return {
    // state from plugin
    networkDropdownOpen,
    alertOpen,
    alertMessage,
    isLoading,
    loadingMessage,
    isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    selectedAddress: state.metamask.selectedAddress,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    isOnboarding: Boolean(seedWords || !isInitialized),
    isPopup: state.metamask.isPopup,
    seedWords: state.metamask.seedWords,
    unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.appState.forgottenPassword,
    lostAccounts,
    frequentRpcListDetail: state.metamask.frequentRpcListDetail || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    isRevealingSeedWords: state.metamask.isRevealingSeedWords,
    Qr: state.appState.Qr,
    welcomeScreenSeen: state.metamask.welcomeScreenSeen,
    providerId: getNetworkIdentifier(state),
    autoLogoutTimeLimit,

    // state needed to get account dropdown temporarily rendering from app bar
    identities,
    selected,
    keyrings,
    providerRequests,
  }
}

function mapDispatchToProps (dispatch) {
  return {
    dispatch,
    hideSidebar: () => dispatch(actions.hideSidebar()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    setCurrentCurrencyToUSD: () => dispatch(actions.setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) => dispatch(actions.setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(actions.setLastActiveTime()),
  }
}

NotificationRoutes.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(NotificationRoutes)
