import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Route, Switch, withRouter, matchPath } from 'react-router-dom'
import { compose } from 'redux'
import * as actions from '../../store/actions'
import log from 'loglevel'
import IdleTimer from 'react-idle-timer'
import {
  getNetworkIdentifier,
  preferencesSelector,
  hasPermissionRequests,
} from '../../selectors/selectors'
import classnames from 'classnames'

// init
import FirstTimeFlow from '../first-time-flow'
// accounts
import SendTransactionScreen from '../send'
import ConfirmTransaction from '../confirm-transaction'

// slideout menu
import Sidebar from '../../components/app/sidebars'

import { WALLET_VIEW_SIDEBAR } from '../../components/app/sidebars/sidebar.constants'

// other views
import Home from '../home'
import Settings from '../settings'
import Authenticated from '../../helpers/higher-order-components/authenticated'
import Initialized from '../../helpers/higher-order-components/initialized'
import Lock from '../lock'
import PermissionsConnect from '../permissions-connect'
import ConnectedSites from '../connected-sites'
import RestoreVaultPage from '../keychains/restore-vault'
import RevealSeedConfirmation from '../keychains/reveal-seed'
import MobileSyncPage from '../mobile-sync'
import AddTokenPage from '../add-token'
import ConfirmAddTokenPage from '../confirm-add-token'
import ConfirmAddSuggestedTokenPage from '../confirm-add-suggested-token'
import CreateAccountPage from '../create-account'

import Loading from '../../components/ui/loading-screen'
import LoadingNetwork from '../../components/app/loading-network-screen'
import NetworkDropdown from '../../components/app/dropdowns/network-dropdown'
import AccountMenu from '../../components/app/account-menu'

// Global Modals
import { Modal } from '../../components/app/modals'

// Global Alert
import Alert from '../../components/ui/alert'

import AppHeader from '../../components/app/app-header'
import UnlockPage from '../unlock-page'

import {
  submittedPendingTransactionsSelector,
} from '../../selectors/transactions'

// Routes
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  UNLOCK_ROUTE,
  SETTINGS_ROUTE,
  REVEAL_SEED_ROUTE,
  MOBILE_SYNC_ROUTE,
  RESTORE_VAULT_ROUTE,
  ADD_TOKEN_ROUTE,
  CONFIRM_ADD_TOKEN_ROUTE,
  CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE,
  NEW_ACCOUNT_ROUTE,
  SEND_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  INITIALIZE_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
  CONNECT_ROUTE,
  CONNECTED_ROUTE,
} from '../../helpers/constants/routes'

// enums
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../app/scripts/lib/enums'

class Routes extends Component {
  UNSAFE_componentWillMount () {
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
    const { autoLockTimeLimit, setLastActiveTime } = this.props

    const routes = (
      <Switch>
        <Route path={LOCK_ROUTE} component={Lock} exact />
        <Route path={INITIALIZE_ROUTE} component={FirstTimeFlow} />
        <Initialized path={UNLOCK_ROUTE} component={UnlockPage} exact />
        <Initialized path={RESTORE_VAULT_ROUTE} component={RestoreVaultPage} exact />
        <Authenticated path={REVEAL_SEED_ROUTE} component={RevealSeedConfirmation} exact />
        <Authenticated path={MOBILE_SYNC_ROUTE} component={MobileSyncPage} exact />
        <Authenticated path={SETTINGS_ROUTE} component={Settings} />
        <Authenticated path={`${CONFIRM_TRANSACTION_ROUTE}/:id?`} component={ConfirmTransaction} />
        <Authenticated path={SEND_ROUTE} component={SendTransactionScreen} exact />
        <Authenticated path={ADD_TOKEN_ROUTE} component={AddTokenPage} exact />
        <Authenticated path={CONFIRM_ADD_TOKEN_ROUTE} component={ConfirmAddTokenPage} exact />
        <Authenticated path={CONFIRM_ADD_SUGGESTED_TOKEN_ROUTE} component={ConfirmAddSuggestedTokenPage} exact />
        <Authenticated path={NEW_ACCOUNT_ROUTE} component={CreateAccountPage} />
        <Authenticated path={`${CONNECT_ROUTE}/:id`} component={PermissionsConnect} />
        <Authenticated path={CONNECTED_ROUTE} component={ConnectedSites} exact />
        <Authenticated path={DEFAULT_ROUTE} component={Home} exact />
      </Switch>
    )

    if (autoLockTimeLimit > 0) {
      return (
        <IdleTimer onAction={setLastActiveTime} throttle={1000}>
          {routes}
        </IdleTimer>
      )
    }

    return routes
  }

  onInitializationUnlockPage () {
    const { location } = this.props
    return Boolean(matchPath(location.pathname, { path: INITIALIZE_UNLOCK_ROUTE, exact: true }))
  }

  onConfirmPage () {
    const { location } = this.props
    return Boolean(matchPath(location.pathname, { path: CONFIRM_TRANSACTION_ROUTE, exact: false }))
  }

  hideAppHeader () {
    const { location, hasPermissionsRequests } = this.props

    const isInitializing = Boolean(matchPath(location.pathname, {
      path: INITIALIZE_ROUTE, exact: false,
    }))

    if (isInitializing && !this.onInitializationUnlockPage()) {
      return true
    }

    if (window.METAMASK_UI_TYPE === ENVIRONMENT_TYPE_NOTIFICATION) {
      return true
    }

    if (window.METAMASK_UI_TYPE === ENVIRONMENT_TYPE_POPUP) {
      return this.onConfirmPage() || hasPermissionsRequests
    }

    const isHandlingPermissionsRequest = Boolean(matchPath(location.pathname, {
      path: CONNECT_ROUTE, exact: false,
    }))

    if (hasPermissionsRequests || isHandlingPermissionsRequest) {
      return true
    }
  }

  render () {
    const {
      isLoading,
      alertMessage,
      textDirection,
      loadingMessage,
      network,
      provider,
      frequentRpcListDetail,
      setMouseUserState,
      sidebar,
      submittedPendingTransactions,
      isMouseUser,
    } = this.props
    const isLoadingNetwork = network === 'loading'
    const loadMessage = loadingMessage || isLoadingNetwork ?
      this.getConnectingLabel(loadingMessage) : null
    log.debug('Main ui render function')

    const {
      isOpen: sidebarIsOpen,
      transitionName: sidebarTransitionName,
      type: sidebarType,
      props,
    } = sidebar
    const { transaction: sidebarTransaction } = props || {}

    const sidebarOnOverlayClose = sidebarType === WALLET_VIEW_SIDEBAR
      ? () => {
        this.context.metricsEvent({
          eventOpts: {
            category: 'Navigation',
            action: 'Wallet Sidebar',
            name: 'Closed Sidebare Via Overlay',
          },
        })
      }
      : null

    const sidebarShouldClose = sidebarTransaction &&
      !sidebarTransaction.status === 'failed' &&
      !submittedPendingTransactions.find(({ id }) => id === sidebarTransaction.id)

    return (
      <div
        className={classnames('app', { 'mouse-user-styles': isMouseUser })}
        dir={textDirection}
        onClick={() => setMouseUserState(true)}
        onKeyDown={(e) => {
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
        {
          !this.hideAppHeader() && (
            <AppHeader
              hideNetworkIndicator={this.onInitializationUnlockPage()}
              disabled={this.onConfirmPage()}
            />
          )
        }
        <Sidebar
          sidebarOpen={sidebarIsOpen}
          sidebarShouldClose={sidebarShouldClose}
          hideSidebar={this.props.hideSidebar}
          transitionName={sidebarTransitionName}
          type={sidebarType}
          sidebarProps={sidebar.props}
          onOverlayClose={sidebarOnOverlayClose}
        />
        <NetworkDropdown
          provider={provider}
          frequentRpcListDetail={frequentRpcListDetail}
        />
        <AccountMenu />
        <div className="main-container-wrapper">
          { isLoading && <Loading loadingMessage={loadMessage} /> }
          { !isLoading && isLoadingNetwork && <LoadingNetwork /> }
          { this.renderRoutes() }
        </div>
      </div>
    )
  }

  toggleMetamaskActive () {
    if (!this.props.isUnlocked) {
      // currently inactive: redirect to password box
      const passwordBox = document.querySelector('input[type=password]')
      if (!passwordBox) {
        return
      }
      passwordBox.focus()
    } else {
      // currently active: deactivate
      this.props.lockMetaMask()
    }
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

  getNetworkName () {
    const { provider } = this.props
    const providerName = provider.type

    let name

    if (providerName === 'mainnet') {
      name = this.context.t('mainnet')
    } else if (providerName === 'ropsten') {
      name = this.context.t('ropsten')
    } else if (providerName === 'kovan') {
      name = this.context.t('kovan')
    } else if (providerName === 'rinkeby') {
      name = this.context.t('rinkeby')
    } else if (providerName === 'localhost') {
      name = this.context.t('localhost')
    } else if (providerName === 'goerli') {
      name = this.context.t('goerli')
    } else {
      name = this.context.t('unknownNetwork')
    }

    return name
  }
}

Routes.propTypes = {
  currentCurrency: PropTypes.string,
  setCurrentCurrencyToUSD: PropTypes.func,
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  alertMessage: PropTypes.string,
  textDirection: PropTypes.string,
  network: PropTypes.string,
  provider: PropTypes.object,
  frequentRpcListDetail: PropTypes.array,
  sidebar: PropTypes.object,
  alertOpen: PropTypes.bool,
  hideSidebar: PropTypes.func,
  isUnlocked: PropTypes.bool,
  setLastActiveTime: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
  lockMetaMask: PropTypes.func,
  submittedPendingTransactions: PropTypes.array,
  isMouseUser: PropTypes.bool,
  setMouseUserState: PropTypes.func,
  providerId: PropTypes.string,
  hasPermissionsRequests: PropTypes.bool,
  autoLockTimeLimit: PropTypes.number,
}

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
    // state from plugin
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
    selectedAddress: state.metamask.selectedAddress,
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
    lockMetaMask: () => dispatch(actions.lockMetamask(false)),
    hideSidebar: () => dispatch(actions.hideSidebar()),
    setCurrentCurrencyToUSD: () => dispatch(actions.setCurrentCurrency('usd')),
    setMouseUserState: (isMouseUser) => dispatch(actions.setMouseUserState(isMouseUser)),
    setLastActiveTime: () => dispatch(actions.setLastActiveTime()),
    showAccountDetail: (address) => dispatch(actions.showAccountDetail(address)),
  }
}

Routes.contextTypes = {
  t: PropTypes.func,
  metricsEvent: PropTypes.func,
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(Routes)
