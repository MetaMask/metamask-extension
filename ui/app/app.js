const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const PropTypes = require('prop-types')
const actions = require('./actions')
const classnames = require('classnames')

// mascara
const MascaraFirstTime = require('../../mascara/src/app/first-time').default
const MascaraBuyEtherScreen = require('../../mascara/src/app/first-time/buy-ether-screen').default
// init
const OldUIInitializeMenuScreen = require('./first-time/init-menu')
const InitializeMenuScreen = MascaraFirstTime
const NewKeyChainScreen = require('./new-keychain')
const WelcomeScreen = require('./welcome-screen').default

// accounts
const MainContainer = require('./main-container')
const SendTransactionScreen2 = require('./components/send/send-v2-container')
const ConfirmTxScreen = require('./conf-tx')
// notice
const NoticeScreen = require('./components/notice')
const generateLostAccountsNotice = require('../lib/lost-accounts-notice')

// slideout menu
const WalletView = require('./components/wallet-view')

// other views
const Settings = require('./settings')
const AddTokenScreen = require('./add-token')
const Import = require('./accounts/import')
const NewAccount = require('./accounts/new-account')
const Loading = require('./components/loading')
const NetworkIndicator = require('./components/network')
const Identicon = require('./components/identicon')
const BuyView = require('./components/buy-button-subview')
const HDCreateVaultComplete = require('./keychains/hd/create-vault-complete')
const HDRestoreVaultScreen = require('./keychains/hd/restore-vault')
const RevealSeedConfirmation = require('./keychains/hd/recover-seed/confirmation')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const NetworkDropdown = require('./components/dropdowns/network-dropdown')
const AccountMenu = require('./components/account-menu')
const QrView = require('./components/qr-code')

// Global Modals
const Modal = require('./components/modals/index').Modal

App.contextTypes = {
  t: PropTypes.func,
}

module.exports = connect(mapStateToProps, mapDispatchToProps)(App)


inherits(App, Component)
function App () { Component.call(this) }

function mapStateToProps (state) {
  const {
    identities,
    accounts,
    address,
    keyrings,
    isInitialized,
    noActiveNotices,
    seedWords,
  } = state.metamask
  const selected = address || Object.keys(accounts)[0]

  return {
    // state from plugin
    networkDropdownOpen: state.appState.networkDropdownOpen,
    sidebarOpen: state.appState.sidebarOpen,
    isLoading: state.appState.isLoading,
    loadingMessage: state.appState.loadingMessage,
    noActiveNotices: state.metamask.noActiveNotices,
    isInitialized: state.metamask.isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    selectedAddress: state.metamask.selectedAddress,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    isMascara: state.metamask.isMascara,
    isOnboarding: Boolean(!noActiveNotices || seedWords || !isInitialized),
    isPopup: state.metamask.isPopup,
    seedWords: state.metamask.seedWords,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.metamask.forgottenPassword,
    lastUnreadNotice: state.metamask.lastUnreadNotice,
    lostAccounts: state.metamask.lostAccounts,
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

App.prototype.componentWillMount = function () {
  if (!this.props.currentCurrency) {
    this.props.setCurrentCurrencyToUSD()
  }
}

App.prototype.render = function () {
  var props = this.props
  const {
    isLoading,
    loadingMessage,
    network,
    isMouseUser,
    setMouseUserState,
  } = props
  const isLoadingNetwork = network === 'loading' && props.currentView.name !== 'config'
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
        provider: this.props.provider,
        frequentRpcList: this.props.frequentRpcList,
      }, []),

      h(AccountMenu),

      (isLoading || isLoadingNetwork) && h(Loading, {
        loadingMessage: loadMessage,
      }),

      // this.renderLoadingIndicator({ isLoading, isLoadingNetwork, loadMessage }),

      // content
      this.renderPrimary(),
    ])
  )
}

App.prototype.renderGlobalModal = function () {
  return h(Modal, {
    ref: 'modalRef',
  }, [
    // h(BuyOptions, {}, []),
  ])
}

App.prototype.renderSidebar = function () {

  return h('div', {
  }, [
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

App.prototype.renderAppBar = function () {
  const {
    isUnlocked,
    network,
    provider,
    networkDropdownOpen,
    showNetworkDropdown,
    hideNetworkDropdown,
    currentView,
    isInitialized,
    betaUI,
    isPopup,
    welcomeScreenSeen,
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
            onClick: () => {
              props.dispatch(actions.backToAccountDetail(props.activeAddress))
            },
          }, [
            // mini logo
            h('img.metafox-icon', {
              height: 42,
              width: 42,
              src: './images/icon-64.png',
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
                disabled: currentView.name === 'confTx',
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

App.prototype.renderLoadingIndicator = function ({ isLoading, isLoadingNetwork, loadMessage }) {
  const { isMascara } = this.props

  return isMascara
    ? null
    : h(Loading, {
      isLoading: isLoading || isLoadingNetwork,
      loadingMessage: loadMessage,
    })
}

App.prototype.renderBackButton = function (style, justArrow = false) {
  var props = this.props
  return (
    h('.flex-row', {
      key: 'leftArrow',
      style: style,
      onClick: () => props.dispatch(actions.goBackToInitView()),
    }, [
      h('i.fa.fa-arrow-left.cursor-pointer'),
      justArrow ? null : h('div.cursor-pointer', {
        style: {
          marginLeft: '3px',
        },
        onClick: () => props.dispatch(actions.goBackToInitView()),
      }, 'BACK'),
    ])
  )
}

App.prototype.renderPrimary = function () {
  log.debug('rendering primary')
  var props = this.props
  const {
    isMascara,
    isOnboarding,
    betaUI,
    isRevealingSeedWords,
    welcomeScreenSeen,
    Qr,
    isInitialized,
    isUnlocked,
  } = props
  const isMascaraOnboarding = isMascara && isOnboarding
  const isBetaUIOnboarding = betaUI && isOnboarding

  if (!welcomeScreenSeen && betaUI && !isInitialized && !isUnlocked) {
    return h(WelcomeScreen)
  }

  if (isMascaraOnboarding || isBetaUIOnboarding) {
    return h(MascaraFirstTime)
  }

  // notices
  if (!props.noActiveNotices && !betaUI) {
    log.debug('rendering notice screen for unread notices.')
    return h(NoticeScreen, {
      notice: props.lastUnreadNotice,
      key: 'NoticeScreen',
      onConfirm: () => props.dispatch(actions.markNoticeRead(props.lastUnreadNotice)),
    })
  } else if (props.lostAccounts && props.lostAccounts.length > 0) {
    log.debug('rendering notice screen for lost accounts view.')
    return h(NoticeScreen, {
      notice: generateLostAccountsNotice(props.lostAccounts),
      key: 'LostAccountsNotice',
      onConfirm: () => props.dispatch(actions.markAccountsFound()),
    })
  }

  if (props.isInitialized && props.forgottenPassword) {
    log.debug('rendering restore vault screen')
    return h(HDRestoreVaultScreen, {key: 'HDRestoreVaultScreen'})
  } else if (!props.isInitialized && !props.isUnlocked && !isRevealingSeedWords) {
    log.debug('rendering menu screen')
    return !betaUI
      ? h(OldUIInitializeMenuScreen, {key: 'menuScreenInit'})
      : h(InitializeMenuScreen, {key: 'menuScreenInit'})
  }

  // show unlock screen
  if (!props.isUnlocked) {
    return h(MainContainer, {
      currentViewName: props.currentView.name,
      isUnlocked: props.isUnlocked,
    })
  }

  // show seed words screen
  if (props.seedWords) {
    log.debug('rendering seed words')
    return h(HDCreateVaultComplete, {key: 'HDCreateVaultComplete'})
  }

  // show current view
  switch (props.currentView.name) {

    case 'accountDetail':
      log.debug('rendering main container')
      return h(MainContainer, {key: 'account-detail'})

    case 'sendTransaction':
      log.debug('rendering send tx screen')

      // Going to leave this here until we are ready to delete SendTransactionScreen v1
      // const SendComponentToRender = checkFeatureToggle('send-v2')
      //   ? SendTransactionScreen2
      //   : SendTransactionScreen

      return h(SendTransactionScreen2, {key: 'send-transaction'})

    case 'sendToken':
      log.debug('rendering send token screen')

      // Going to leave this here until we are ready to delete SendTransactionScreen v1
      // const SendTokenComponentToRender = checkFeatureToggle('send-v2')
      //   ? SendTransactionScreen2
      //   : SendTokenScreen

      return h(SendTransactionScreen2, {key: 'sendToken'})

    case 'newKeychain':
      log.debug('rendering new keychain screen')
      return h(NewKeyChainScreen, {key: 'new-keychain'})

    case 'confTx':
      log.debug('rendering confirm tx screen')
      return h(ConfirmTxScreen, {key: 'confirm-tx'})

    case 'add-token':
      log.debug('rendering add-token screen from unlock screen.')
      return h(AddTokenScreen, {key: 'add-token'})

    case 'config':
      log.debug('rendering config screen')
      return h(Settings, {key: 'config'})

    case 'import-menu':
      log.debug('rendering import screen')
      return h(Import, {key: 'import-menu'})

    case 'new-account-page':
      log.debug('rendering new account screen')
      return h(NewAccount, {key: 'new-account'})

    case 'reveal-seed-conf':
      log.debug('rendering reveal seed confirmation screen')
      return h(RevealSeedConfirmation, {key: 'reveal-seed-conf'})

    case 'info':
      log.debug('rendering info screen')
      return h(Settings, {key: 'info', tab: 'info'})

    case 'buyEth':
      log.debug('rendering buy ether screen')
      return h(BuyView, {key: 'buyEthView'})

    case 'onboardingBuyEth':
      log.debug('rendering onboarding buy ether screen')
      return h(MascaraBuyEtherScreen, {key: 'buyEthView'})

    case 'qr':
      log.debug('rendering show qr screen')
      return h('div', {
        style: {
          position: 'absolute',
          height: '100%',
          top: '0px',
          left: '0px',
        },
      }, [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer.color-orange', {
          onClick: () => props.dispatch(actions.backToAccountDetail(props.activeAddress)),
          style: {
            marginLeft: '10px',
            marginTop: '50px',
          },
        }),
        h('div', {
          style: {
            position: 'absolute',
            left: '44px',
            width: '285px',
          },
        }, [
          h(QrView, {key: 'qr', Qr}),
        ]),
      ])

    default:
      log.debug('rendering default, account detail screen')
      return h(MainContainer, {key: 'account-detail'})
  }
}

App.prototype.toggleMetamaskActive = function () {
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

App.prototype.getConnectingLabel = function () {
  const { provider } = this.props
  const providerName = provider.type

  let name

  if (providerName === 'mainnet') {
    name = this.context.t('connectingToMainnet')
  // } else if (providerName === 'ropsten') {
  //   name = this.context.t('connectingToRopsten')
  // } else if (providerName === 'kovan') {
  //   name = this.context.t('connectingToRopsten')
  // } else if (providerName === 'rinkeby') {
  //   name = this.context.t('connectingToRinkeby')
  } else {
    name = this.context.t('connectingToUnknown')
  }

  return name
}

App.prototype.getNetworkName = function () {
  const { provider } = this.props
  const providerName = provider.type

  let name

  if (providerName === 'mainnet') {
    name = this.context.t('mainnet')
  // } else if (providerName === 'ropsten') {
  //   name = this.context.t('ropsten')
  // } else if (providerName === 'kovan') {
  //   name = this.context.t('kovan')
  // } else if (providerName === 'rinkeby') {
  //   name = this.context.t('rinkeby')
  } else {
    name = this.context.t('unknownNetwork')
  }

  return name
}
