const { Component } = require('react')
const PropTypes = require('prop-types')
const connect = require('react-redux').connect
const { Route, Switch, withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const h = require('react-hyperscript')
const actions = require('./actions')
const classnames = require('classnames')
const log = require('loglevel')

// init
const InitializeScreen = require('../../mascara/src/app/first-time').default
// accounts
const SendTransactionScreen2 = require('./components/send/send-v2-container')
const ConfirmTxScreen = require('./conf-tx')

// slideout menu
const WalletView = require('./components/wallet-view')

// other views
const Home = require('./components/pages/home')
const Authenticated = require('./components/pages/authenticated')
const Initialized = require('./components/pages/initialized')
const Settings = require('./components/pages/settings')
const UnlockPage = require('./components/pages/unlock')
const RestoreVaultPage = require('./components/pages/keychains/restore-vault')
const RevealSeedConfirmation = require('./keychains/hd/recover-seed/confirmation')
const AddTokenPage = require('./components/pages/add-token')
const CreateAccountPage = require('./components/pages/create-account')
const NoticeScreen = require('./components/pages/notice')

const Loading = require('./components/loading')
const NetworkIndicator = require('./components/network')
const Identicon = require('./components/identicon')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const NetworkDropdown = require('./components/dropdowns/network-dropdown')
const AccountMenu = require('./components/account-menu')

// Global Modals
const Modal = require('./components/modals/index').Modal

// Routes
const {
  DEFAULT_ROUTE,
  UNLOCK_ROUTE,
  SETTINGS_ROUTE,
  REVEAL_SEED_ROUTE,
  RESTORE_VAULT_ROUTE,
  ADD_TOKEN_ROUTE,
  NEW_ACCOUNT_ROUTE,
  SEND_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  INITIALIZE_ROUTE,
  NOTICE_ROUTE,
} = require('./routes')

class App extends Component {
  componentWillMount () {
    const { currentCurrency, setCurrentCurrencyToUSD } = this.props

    if (!currentCurrency) {
      setCurrentCurrencyToUSD()
    }
  }

  renderRoutes () {
    const exact = true

    return (
      h(Switch, [
        h(Route, { path: INITIALIZE_ROUTE, component: InitializeScreen }),
        h(Initialized, { path: REVEAL_SEED_ROUTE, exact, component: RevealSeedConfirmation }),
        h(Initialized, { path: UNLOCK_ROUTE, exact, component: UnlockPage }),
        h(Initialized, { path: SETTINGS_ROUTE, component: Settings }),
        h(Initialized, { path: RESTORE_VAULT_ROUTE, exact, component: RestoreVaultPage }),
        h(Initialized, { path: NOTICE_ROUTE, exact, component: NoticeScreen }),
        h(Authenticated, { path: CONFIRM_TRANSACTION_ROUTE, component: ConfirmTxScreen }),
        h(Authenticated, { path: SEND_ROUTE, exact, component: SendTransactionScreen2 }),
        h(Authenticated, { path: ADD_TOKEN_ROUTE, exact, component: AddTokenPage }),
        h(Authenticated, { path: NEW_ACCOUNT_ROUTE, component: CreateAccountPage }),
        h(Authenticated, { path: DEFAULT_ROUTE, exact, component: Home }),
      ])
    )
  }

  render () {
    const {
      isLoading,
      loadingMessage,
      network,
      isMouseUser,
      provider,
      frequentRpcList,
      currentView,
      setMouseUserState,
    } = this.props
    const isLoadingNetwork = network === 'loading' && currentView.name !== 'config'
    const loadMessage = loadingMessage || isLoadingNetwork ?
      this.getConnectingLabel() : null
    log.debug('Main ui render function')

    return (
      h('.flex-column.full-height', {
        className: classnames({ 'mouse-user-styles': isMouseUser }),
        style: {
          overflowX: 'hidden',
          position: 'relative',
          alignItems: 'center',
        },
        tabIndex: '0',
        onClick: () => setMouseUserState(true),
        onKeyDown: (e) => {
          if (e.keyCode === 9) {
            setMouseUserState(false)
          }
        },
      }, [

        // global modal
        h(Modal, {}, []),

        // app bar
        this.renderAppBar(),

        // sidebar
        this.renderSidebar(),

        // network dropdown
        h(NetworkDropdown, {
          provider,
          frequentRpcList,
        }, []),

        h(AccountMenu),

        (isLoading || isLoadingNetwork) && h(Loading, {
          loadingMessage: loadMessage,
        }),

        // this.renderLoadingIndicator({ isLoading, isLoadingNetwork, loadMessage }),

        // content
        this.renderRoutes(),
      ])
    )
  }

  renderGlobalModal () {
    return h(Modal, {
      ref: 'modalRef',
    }, [
      // h(BuyOptions, {}, []),
    ])
  }

  renderSidebar () {
    return h('div', [
      h('style', `
        .sidebar-enter {
          transition: transform 300ms ease-in-out;
          transform: translateX(-100%);
        }
        .sidebar-enter.sidebar-enter-active {
          transition: transform 300ms ease-in-out;
          transform: translateX(0%);
        }
        .sidebar-leave {
          transition: transform 200ms ease-out;
          transform: translateX(0%);
        }
        .sidebar-leave.sidebar-leave-active {
          transition: transform 200ms ease-out;
          transform: translateX(-100%);
        }
      `),

      h(ReactCSSTransitionGroup, {
        transitionName: 'sidebar',
        transitionEnterTimeout: 300,
        transitionLeaveTimeout: 200,
      }, [
        // A second instance of Walletview is used for non-mobile viewports
        this.props.sidebarOpen ? h(WalletView, {
          responsiveDisplayClassname: '.sidebar',
          style: {},
        }) : undefined,

      ]),

      // overlay
      // TODO: add onClick for overlay to close sidebar
      this.props.sidebarOpen ? h('div.sidebar-overlay', {
        style: {},
        onClick: () => {
          this.props.hideSidebar()
        },
      }, []) : undefined,
    ])
  }

  renderAppBar () {
    const {
      isUnlocked,
      network,
      provider,
      networkDropdownOpen,
      showNetworkDropdown,
      hideNetworkDropdown,
      isInitialized,
      welcomeScreenSeen,
      isPopup,
      betaUI,
    } = this.props

    if (window.METAMASK_UI_TYPE === 'notification') {
      return null
    }

    const props = this.props
    const {isMascara, isOnboarding} = props

    // Do not render header if user is in mascara onboarding
    if (isMascara && isOnboarding) {
      return null
    }

    // Do not render header if user is in mascara buy ether
    if (isMascara && props.currentView.name === 'buyEth') {
      return null
    }

    return (

      h('.full-width', {
        style: {},
      }, [

        (isInitialized || welcomeScreenSeen || isPopup || !betaUI) && h('.app-header.flex-row.flex-space-between', {
          className: classnames({
            'app-header--initialized': !isOnboarding,
          }),
        }, [
          h('div.app-header-contents', {}, [
            h('div.left-menu-wrapper', {
              onClick: () => props.history.push(DEFAULT_ROUTE),
            }, [
              // mini logo
              h('img.metafox-icon', {
                height: 42,
                width: 42,
                src: '/images/metamask-fox.svg',
              }),

              // metamask name
              h('.flex-row', [
                h('h1', this.context.t('appName')),
                h('div.beta-label', this.context.t('beta')),
              ]),

            ]),

            betaUI && isInitialized && h('div.header__right-actions', [
              h('div.network-component-wrapper', {
                style: {},
              }, [
                // Network Indicator
                h(NetworkIndicator, {
                  network,
                  provider,
                  disabled: this.props.location.pathname === CONFIRM_TRANSACTION_ROUTE,
                  onClick: (event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    return networkDropdownOpen === false
                      ? showNetworkDropdown()
                      : hideNetworkDropdown()
                  },
                }),

              ]),

              isUnlocked && h('div.account-menu__icon', { onClick: this.props.toggleAccountMenu }, [
                h(Identicon, {
                  address: this.props.selectedAddress,
                  diameter: 32,
                }),
              ]),
            ]),
          ]),
        ]),

        !isInitialized && !isPopup && betaUI && h('.alpha-warning__container', {}, [
          h('h2', {
            className: classnames({
              'alpha-warning': welcomeScreenSeen,
              'alpha-warning-welcome-screen': !welcomeScreenSeen,
            }),
          }, 'Please be aware that this version is still under development'),
        ]),

      ])
    )
  }

  renderLoadingIndicator ({ isLoading, isLoadingNetwork, loadMessage }) {
    const { isMascara } = this.props

    return isMascara
      ? null
      : h(Loading, {
        isLoading: isLoading || isLoadingNetwork,
        loadingMessage: loadMessage,
      })
  }

  toggleMetamaskActive () {
    if (!this.props.isUnlocked) {
      // currently inactive: redirect to password box
      var passwordBox = document.querySelector('input[type=password]')
      if (!passwordBox) return
      passwordBox.focus()
    } else {
      // currently active: deactivate
      this.props.dispatch(actions.lockMetamask(false))
    }
  }

  getConnectingLabel = function () {
    const { provider } = this.props
    const providerName = provider.type

    let name

    if (providerName === 'mainnet') {
      name = this.context.t('connectingToMainnet')
    } else if (providerName === 'ropsten') {
      name = this.context.t('connectingToRopsten')
    } else if (providerName === 'kovan') {
      name = this.context.t('connectingToRopsten')
    } else if (providerName === 'rinkeby') {
      name = this.context.t('connectingToRinkeby')
    } else {
      name = this.context.t('connectingToUnknown')
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
    } else {
      name = this.context.t('unknownNetwork')
    }

    return name
  }
}

App.propTypes = {
  currentCurrency: PropTypes.string,
  setCurrentCurrencyToUSD: PropTypes.func,
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  network: PropTypes.string,
  provider: PropTypes.object,
  frequentRpcList: PropTypes.array,
  currentView: PropTypes.object,
  sidebarOpen: PropTypes.bool,
  hideSidebar: PropTypes.func,
  isMascara: PropTypes.bool,
  isOnboarding: PropTypes.bool,
  isUnlocked: PropTypes.bool,
  networkDropdownOpen: PropTypes.bool,
  showNetworkDropdown: PropTypes.func,
  hideNetworkDropdown: PropTypes.func,
  history: PropTypes.object,
  location: PropTypes.object,
  dispatch: PropTypes.func,
  toggleAccountMenu: PropTypes.func,
  selectedAddress: PropTypes.string,
  noActiveNotices: PropTypes.bool,
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
  betaUI: PropTypes.bool,
  isMouseUser: PropTypes.bool,
  setMouseUserState: PropTypes.func,
  t: PropTypes.func,
}

function mapStateToProps (state) {
  const { appState, metamask } = state
  const {
    networkDropdownOpen,
    sidebarOpen,
    isLoading,
    loadingMessage,
  } = appState

  const {
    identities,
    accounts,
    address,
    keyrings,
    isInitialized,
    noActiveNotices,
    seedWords,
    unapprovedTxs,
    lastUnreadNotice,
    lostAccounts,
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = metamask
  const selected = address || Object.keys(accounts)[0]

  return {
    // state from plugin
    networkDropdownOpen,
    sidebarOpen,
    isLoading,
    loadingMessage,
    noActiveNotices,
    isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    selectedAddress: state.metamask.selectedAddress,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    isMascara: state.metamask.isMascara,
    isOnboarding: Boolean(!noActiveNotices || seedWords || !isInitialized),
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
    lastUnreadNotice,
    lostAccounts,
    frequentRpcList: state.metamask.frequentRpcList || [],
    currentCurrency: state.metamask.currentCurrency,
    isMouseUser: state.appState.isMouseUser,
    betaUI: state.metamask.featureFlags.betaUI,
    isRevealingSeedWords: state.metamask.isRevealingSeedWords,
    Qr: state.appState.Qr,
    welcomeScreenSeen: state.metamask.welcomeScreenSeen,

    // state needed to get account dropdown temporarily rendering from app bar
    identities,
    selected,
    keyrings,
  }
}

function mapDispatchToProps (dispatch, ownProps) {
  return {
    dispatch,
    hideSidebar: () => dispatch(actions.hideSidebar()),
    showNetworkDropdown: () => dispatch(actions.showNetworkDropdown()),
    hideNetworkDropdown: () => dispatch(actions.hideNetworkDropdown()),
    setCurrentCurrencyToUSD: () => dispatch(actions.setCurrentCurrency('usd')),
    toggleAccountMenu: () => dispatch(actions.toggleAccountMenu()),
    setMouseUserState: (isMouseUser) => dispatch(actions.setMouseUserState(isMouseUser)),
  }
}

App.contextTypes = {
  t: PropTypes.func,
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(App)
