const { Component } = require('react')
const { connect } = require('react-redux')
const { Switch, Route, Redirect, withRouter } = require('react-router-dom')
const { compose } = require('recompose')
const h = require('react-hyperscript')
const actions = require('./actions')
// mascara
const MascaraFirstTime = require('../../mascara/src/app/first-time').default
const MascaraBuyEtherScreen = require('../../mascara/src/app/first-time/buy-ether-screen').default
// init
const InitializeMenuScreen = require('./first-time/init-menu')
const NewKeyChainScreen = require('./new-keychain')
// accounts
const MainContainer = require('./main-container')
const SendTransactionScreen2 = require('./components/send/send-v2-container')
const ConfirmTxScreen = require('./conf-tx')
// notice
const generateLostAccountsNotice = require('../lib/lost-accounts-notice')

// slideout menu
const WalletView = require('./components/wallet-view')

// other views
const Authenticated = require('./components/pages/authenticated')
const Settings = require('./components/pages/settings')
const UnlockPage = require('./components/pages/unauthenticated/unlock')
const RestoreVaultPage = require('./components/pages/keychains/restore-vault')
const RevealSeedPage = require('./components/pages/keychains/reveal-seed')
const AddTokenPage = require('./components/pages/add-token')
const ImportAccountPage = require('./components/pages/import-account')
const NoticeScreen = require('./components/pages/notice')

const Loading = require('./components/loading')
const NetworkIndicator = require('./components/network')
const Identicon = require('./components/identicon')
const BuyView = require('./components/buy-button-subview')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
const NetworkDropdown = require('./components/dropdowns/network-dropdown')
const AccountMenu = require('./components/account-menu')
const QrView = require('./components/qr-code')

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
  IMPORT_ACCOUNT_ROUTE,
  SEND_ROUTE,
  CONFIRM_TRANSACTION_ROUTE,
  INITIALIZE_MENU_ROUTE,
  NOTICE_ROUTE,
} = require('./routes')

class App extends Component {
  constructor (props) {
    super(props)

    this.renderPrimary = this.renderPrimary.bind(this)
  }

  componentWillMount () {
    const { currentCurrency, setCurrentCurrency } = this.props

    if (!currentCurrency) {
      setCurrentCurrencyToUSD()
    }
  }

  renderRoutes () {
    const exact = true

    return (
      h(Switch, [
        h(Route, { path: INITIALIZE_MENU_ROUTE, exact, component: InitializeMenuScreen }),
        h(Route, { path: UNLOCK_ROUTE, exact, component: UnlockPage }),
        h(Route, { path: SETTINGS_ROUTE, component: Settings }),
        h(Route, { path: RESTORE_VAULT_ROUTE, exact, component: RestoreVaultPage }),
        h(Route, { path: NOTICE_ROUTE, exact, component: NoticeScreen }),
        h(Authenticated, { path: CONFIRM_TRANSACTION_ROUTE, exact, component: ConfirmTxScreen }),
        h(Authenticated, { path: SEND_ROUTE, exact, component: SendTransactionScreen2 }),
        h(Authenticated, { path: REVEAL_SEED_ROUTE, exact, component: RevealSeedPage }),
        h(Authenticated, { path: ADD_TOKEN_ROUTE, exact, component: AddTokenPage }),
        h(Authenticated, { path: IMPORT_ACCOUNT_ROUTE, exact, component: ImportAccountPage }),
        h(Authenticated, { path: DEFAULT_ROUTE, exact, component: this.renderPrimary }),
      ])
    )
  }

  render () {
    var props = this.props
    const { isLoading, loadingMessage, network } = props
    const isLoadingNetwork = network === 'loading' && props.currentView.name !== 'config'
    const loadMessage = loadingMessage || isLoadingNetwork ?
      `Connecting to ${this.getNetworkName()}` : null
    log.debug('Main ui render function')

    return (
      h('.flex-column.full-height', {
        style: {
          overflowX: 'hidden',
          position: 'relative',
          alignItems: 'center',
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
        this.renderRoutes(),
        // this.renderPrimary(),
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
      currentView,
      isMascara,
      isOnboarding,
      history,
    } = this.props

    if (window.METAMASK_UI_TYPE === 'notification') {
      return null
    }

    // Do not render header if user is in mascara onboarding
    if (isMascara && isOnboarding) {
      return null
    }

    // Do not render header if user is in mascara buy ether
    if (isMascara && currentView.name === 'buyEth') {
      return null
    }

    return (

      h('.full-width', {
        style: {},
      }, [

        h('.app-header.flex-row.flex-space-between', {
          style: {},
        }, [
          h('div.app-header-contents', {}, [
            h('div.left-menu-wrapper', {
              onClick: () => history.push(DEFAULT_ROUTE),
            }, [
              // mini logo
              h('img.metafox-icon', {
                height: 29,
                width: 29,
                src: '/images/icon-128.png',
              }),

              // metamask name
              h('h1', {
                style: {
                  position: 'relative',
                  paddingLeft: '9px',
                  color: '#5B5D67',
                },
              }, 'MetaMask'),

            ]),

            h('div.header__right-actions', [
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

  renderBackButton (style, justArrow = false) {
    const { dispatch } = this.props

    return (
      h('.flex-row', {
        key: 'leftArrow',
        style: style,
        onClick: () => dispatch(actions.goBackToInitView()),
      }, [
        h('i.fa.fa-arrow-left.cursor-pointer'),
        justArrow ? null : h('div.cursor-pointer', {
          style: {
            marginLeft: '3px',
          },
          onClick: () => dispatch(actions.goBackToInitView()),
        }, 'BACK'),
      ])
    )
  }

  renderPrimary () {
    log.debug('rendering primary')
    const {
      isMascara,
      isOnboarding,
      noActiveNotices,
      lostAccounts,
      isInitialized,
      forgottenPassword,
      currentView,
      activeAddress,
      unapprovedTxs = {},
    } = this.props

    if (isMascara && isOnboarding) {
      return h(MascaraFirstTime)
    }

    // notices
    if (!noActiveNotices || (lostAccounts && lostAccounts.length > 0)) {
      return h(Redirect, {
        to: {
          pathname: NOTICE_ROUTE,
        },
      })
    }

    // unapprovedTxs
    if (Object.keys(unapprovedTxs).length) {
      return h(Redirect, {
        to: {
          pathname: CONFIRM_TRANSACTION_ROUTE,
        },
      })
    }

    // if (!props.noActiveNotices) {
    //   log.debug('rendering notice screen for unread notices.')
    //   return h(NoticeScreen, {
    //     notice: props.lastUnreadNotice,
    //     key: 'NoticeScreen',
    //     onConfirm: () => props.dispatch(actions.markNoticeRead(props.lastUnreadNotice)),
    //   })
    // } else if (props.lostAccounts && props.lostAccounts.length > 0) {
    //   log.debug('rendering notice screen for lost accounts view.')
    //   return h(NoticeScreen, {
    //     notice: generateLostAccountsNotice(props.lostAccounts),
    //     key: 'LostAccountsNotice',
    //     onConfirm: () => props.dispatch(actions.markAccountsFound()),
    //   })
    // }

    // if (props.seedWords) {
    //   log.debug('rendering seed words')
    //   return h(HDCreateVaultComplete, {key: 'HDCreateVaultComplete'})
    // }

    // show initialize screen
    if (!isInitialized || forgottenPassword) {
      // show current view
      log.debug('rendering an initialize screen')
      // switch (props.currentView.name) {

        // case 'restoreVault':
        //   log.debug('rendering restore vault screen')
        //   return h(HDRestoreVaultScreen, {key: 'HDRestoreVaultScreen'})

      //   default:
      //     log.debug('rendering menu screen')
      //     return h(InitializeMenuScreen, {key: 'menuScreenInit'})
      // }
    }

    // // show unlock screen
    // if (!props.isUnlocked) {
    //   return h(MainContainer, {
    //     currentViewName: props.currentView.name,
    //     isUnlocked: props.isUnlocked,
    //   })
    // }

    // show current view
    switch (currentView.name) {

      case 'accountDetail':
        log.debug('rendering main container')
        return h(MainContainer, {key: 'account-detail'})

      // case 'sendTransaction':
      //   log.debug('rendering send tx screen')

      //   // Going to leave this here until we are ready to delete SendTransactionScreen v1
      //   // const SendComponentToRender = checkFeatureToggle('send-v2')
      //   //   ? SendTransactionScreen2
      //   //   : SendTransactionScreen

      //   return h(SendTransactionScreen2, {key: 'send-transaction'})

      // case 'sendToken':
      //   log.debug('rendering send token screen')

      //   // Going to leave this here until we are ready to delete SendTransactionScreen v1
      //   // const SendTokenComponentToRender = checkFeatureToggle('send-v2')
      //   //   ? SendTransactionScreen2
      //   //   : SendTokenScreen

      //   return h(SendTransactionScreen2, {key: 'sendToken'})

      case 'newKeychain':
        log.debug('rendering new keychain screen')
        return h(NewKeyChainScreen, {key: 'new-keychain'})

      // case 'confTx':
      //   log.debug('rendering confirm tx screen')
      //   return h(Redirect, {
      //     to: {
      //       pathname: CONFIRM_TRANSACTION_ROUTE,
      //     },
      //   })
        // return h(ConfirmTxScreen, {key: 'confirm-tx'})

      // case 'add-token':
      //   log.debug('rendering add-token screen from unlock screen.')
      //   return h(AddTokenScreen, {key: 'add-token'})

      // case 'config':
      //   log.debug('rendering config screen')
      //   return h(Settings, {key: 'config'})

      // case 'import-menu':
      //   log.debug('rendering import screen')
      //   return h(Import, {key: 'import-menu'})

      // case 'reveal-seed-conf':
      //   log.debug('rendering reveal seed confirmation screen')
      //   return h(RevealSeedConfirmation, {key: 'reveal-seed-conf'})

      // case 'info':
      //   log.debug('rendering info screen')
      //   return h(Settings, {key: 'info', tab: 'info'})

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
            onClick: () => this.props.dispatch(actions.backToAccountDetail(activeAddress)),
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
            h(QrView, {key: 'qr'}),
          ]),
        ])

      default:
        log.debug('rendering default, account detail screen')
        return h(MainContainer, {key: 'account-detail'})
    }
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

  getNetworkName () {
    const { provider } = this.props
    const providerName = provider.type

    let name

    if (providerName === 'mainnet') {
      name = 'Main Ethereum Network'
    } else if (providerName === 'ropsten') {
      name = 'Ropsten Test Network'
    } else if (providerName === 'kovan') {
      name = 'Kovan Test Network'
    } else if (providerName === 'rinkeby') {
      name = 'Rinkeby Test Network'
    } else {
      name = 'Unknown Private Network'
    }

    return name
  }
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
    seedWords: state.metamask.seedWords,
    unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.appState.forgottenPassword,
    lastUnreadNotice,
    lostAccounts,
    frequentRpcList: state.metamask.frequentRpcList || [],
    currentCurrency: state.metamask.currentCurrency,

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
  }
}

module.exports = compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps)
)(App)
