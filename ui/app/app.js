const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('./actions')
// init
const InitializeMenuScreen = require('./first-time/init-menu')
const NewKeyChainScreen = require('./new-keychain')
// unlock
const UnlockScreen = require('./unlock')
// accounts
const MainContainer = require('./main-container')
const SendTransactionScreen = require('./send')
const ConfirmTxScreen = require('./conf-tx')
// notice
const NoticeScreen = require('./components/notice')
const generateLostAccountsNotice = require('../lib/lost-accounts-notice')

// slideout menu
const WalletView = require('./components/wallet-view')
const SlideoutMenu = require('react-burger-menu').slide

// other views
const ConfigScreen = require('./config')
const AddTokenScreen = require('./add-token')
const Import = require('./accounts/import')
const InfoScreen = require('./info')
const Loading = require('./components/loading')
const SandwichExpando = require('sandwich-expando')
const Dropdown = require('./components/dropdown').Dropdown
const DropdownMenuItem = require('./components/dropdown').DropdownMenuItem
const NetworkIndicator = require('./components/network')
const BuyView = require('./components/buy-button-subview')
const QrView = require('./components/qr-code')
const HDCreateVaultComplete = require('./keychains/hd/create-vault-complete')
const HDRestoreVaultScreen = require('./keychains/hd/restore-vault')
const RevealSeedConfirmation = require('./keychains/hd/recover-seed/confirmation')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')

module.exports = connect(mapStateToProps)(App)

inherits(App, Component)
function App () { Component.call(this) }

function mapStateToProps (state) {
  return {
    // state from plugin
    sidebarOpen: state.appState.sidebarOpen,
    isLoading: state.appState.isLoading,
    loadingMessage: state.appState.loadingMessage,
    noActiveNotices: state.metamask.noActiveNotices,
    isInitialized: state.metamask.isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    seedWords: state.metamask.seedWords,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.appState.forgottenPassword,
    lastUnreadNotice: state.metamask.lastUnreadNotice,
    lostAccounts: state.metamask.lostAccounts,
    frequentRpcList: state.metamask.frequentRpcList || [],
  }
}

App.prototype.render = function () {
  var props = this.props
  const { isLoading, loadingMessage, transForward, network, sidebarOpen } = props
  const isLoadingNetwork = network === 'loading' && props.currentView.name !== 'config'
  const loadMessage = loadingMessage || isLoadingNetwork ?
    `Connecting to ${this.getNetworkName()}` : null
  log.debug('Main ui render function')

  return (

    h('.flex-column.full-height', {
      style: {
        // Windows was showing a vertical scroll bar:
        overflowX: 'hidden',
        // TODO: check with dev who committed L75, see if this still happens, and whether auto is enough
        // overflowY: 'auto',
        position: 'relative',
        alignItems: 'center',
      },
    }, [


      // app bar
      this.renderAppBar(),

      // slideout - move to separate render func
      this.renderSidebar(),
      // h('div.phone-visible', {} ,[
      //   h(SlideoutMenu, {
      //     isOpen: false,
      //   }, [
      //     h(WalletView, {
      //       responsiveDisplayClassname: '.phone-visible',
      //     }),
      //   ]),
      // ])

      // network dropdown
      this.renderNetworkDropdown(),
      // this.renderDropdown(),

      h(Loading, {
        isLoading: isLoading || isLoadingNetwork,
        loadingMessage: loadMessage,
      }),

      // panel content
      this.renderPrimary(),
    ])
  )
}

App.prototype.renderSidebar = function() {
  // if (!this.props.sidebarOpen) {
  //   return null;
  // }

  return h('div', {
  }, [
    h('style', `
      .sidebar-enter {
        transition: transform 500ms ease-in-out;
        transform: translateX(-100%);
      }
      .sidebar-enter.sidebar-enter-active {
        transition: transform 500ms ease-in-out;
        transform: translateX(0%);
      }
      .sidebar-leave {
        transition: transform 500ms ease-in-out;
        transform: translateX(0%);
      }
      .sidebar-leave.sidebar-leave-active {
        transition: transform 500ms ease-in-out;
        transform: translateX(-100%);
      }
    `),

    h(ReactCSSTransitionGroup, {
      transitionName: 'sidebar',
      transitionEnterTimeout: 500,
      transitionLeaveTimeout: 500,
    }, [
      // content
      this.props.sidebarOpen ? h(WalletView, {
        responsiveDisplayClassname: '.sidebar',
        style: {
          zIndex: 26,
          position: 'fixed',
          top: '6%',
          left: '0px',
          right: '0px',
          bottom: '0px',
          opacity: '1',
          visibility: 'visible',
          // transition: 'transform 1s ease-in',
          willChange: 'transform',
          // transform: 'translateX(300px)',
          overflowY: 'auto',
          boxShadow: 'rgba(0, 0, 0, 0.15) 2px 2px 4px',
          width: '85%',
          height: '100%',
        },
      }) : undefined,

    ]),

    // overlay
    // TODO: add onClick for overlay to close sidebar
    this.props.sidebarOpen ? h('div', {
      style: {
        zIndex: 25,
        position: 'fixed',
        top: '6%',
        left: '0px',
        right: '0px',
        bottom: '0px',
        opacity: '1',
        visibility: 'visible',
        // transition: 'opacity 0.3s ease-out, visibility 0.3s ease-out',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
      }
    }, []) : undefined,
  ])
}

App.prototype.renderAppBar = function () {
  if (window.METAMASK_UI_TYPE === 'notification') {
    return null
  }

  const props = this.props
  const state = this.state || {}
  const isNetworkMenuOpen = state.isNetworkMenuOpen || false

  return (

    h('.full-width', {
      height: '38px',
    }, [

      h('.app-header.flex-row.flex-space-between', {
        style: {
          alignItems: 'center',
          visibility: props.isUnlocked ? 'visible' : 'none',
          background: '#EFEFEF', // $gallery
          height: '11vh',
          position: 'relative',
          zIndex: 12,
        },
      }, [

        h('div.left-menu-section', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: '1.8em',
          },
        }, [
          // mini logo
          h('img', {
            height: 24,
            width: 24,
            src: '/images/icon-128.png',
          }),

          // metamask name
          h('h1', {
            style: {
              position: 'relative',
              left: '9px',
            },
          }, 'MetaMask'),

        ]),

        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: '1.8em',
          },
        }, [
          // Network Indicator
          h(NetworkIndicator, {
            network: this.props.network,
            provider: this.props.provider,
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
            },
          }),

        ]),
      ]),

    ])
  )
}

App.prototype.renderNetworkDropdown = function () {
  const props = this.props
  const { provider: { type: providerType, rpcTarget: activeNetwork } } = props
  const rpcList = props.frequentRpcList
  const state = this.state || {}
  const isOpen = state.isNetworkMenuOpen

  return h(Dropdown, {
    isOpen,
    onClickOutside: (event) => {
      const { classList } = event.target
      const isNotToggleElement = [
        classList.contains('menu-icon'),
        classList.contains('network-name'),
        classList.contains('network-indicator'),
      ].filter(bool => bool).length === 0;
      // classes from three constituent nodes of the toggle element

      if (isNotToggleElement) {
        this.setState({ isNetworkMenuOpen: false })
      }
    },
    zIndex: 11,
    style: {
      position: 'absolute',
      right: '2px',
      top: '38px',
    },
    innerStyle: {
      padding: '2px 16px 2px 0px',
    },
  }, [

    h(
      DropdownMenuItem,
      {
        key: 'main',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('mainnet')),
      },
      [
        h('.menu-icon.diamond'),
        'Main Ethereum Network',
        providerType === 'mainnet' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'ropsten',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('ropsten')),
      },
      [
        h('.menu-icon.red-dot'),
        'Ropsten Test Network',
        providerType === 'ropsten' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'kovan',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('kovan')),
      },
      [
        h('.menu-icon.hollow-diamond'),
        'Kovan Test Network',
        providerType === 'kovan' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'rinkeby',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('rinkeby')),
      },
      [
        h('.menu-icon.golden-square'),
        'Rinkeby Test Network',
        providerType === 'rinkeby' ? h('.check', '✓') : null,
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'default',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setDefaultRpcTarget()),
      },
      [
        h('i.fa.fa-question-circle.fa-lg.menu-icon'),
        'Localhost 8545',
        activeNetwork === 'http://localhost:8545' ? h('.check', '✓') : null,
      ]
    ),

    this.renderCustomOption(props.provider),
    this.renderCommonRpc(rpcList, props.provider),

    h(
      DropdownMenuItem,
      {
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => this.props.dispatch(actions.showConfigPage()),
      },
      [
        h('i.fa.fa-question-circle.fa-lg.menu-icon'),
        'Custom RPC',
        activeNetwork === 'custom' ? h('.check', '✓') : null,
      ]
    ),

  ])
}

App.prototype.renderDropdown = function () {
  const state = this.state || {}
  const isOpen = state.isMainMenuOpen

  return h(Dropdown, {
    isOpen: isOpen,
    zIndex: 11,
    onClickOutside: (event) => {
      const { classList } = event.target
      const isNotToggleElement = !classList.contains('sandwich-expando')
      if (isNotToggleElement) {
        this.setState({ isMainMenuOpen: false })
      }
    },
    style: {
      position: 'absolute',
      right: '2px',
      top: '38px',
    },
    innerStyle: {},
  }, [
    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => { this.props.dispatch(actions.showConfigPage()) },
    }, 'Settings'),

    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => { this.props.dispatch(actions.lockMetamask()) },
    }, 'Lock'),

    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => { this.props.dispatch(actions.showInfoPage()) },
    }, 'Info/Help'),
  ])
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

  // notices
  if (!props.noActiveNotices) {
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

  if (props.seedWords) {
    log.debug('rendering seed words')
    return h(HDCreateVaultComplete, {key: 'HDCreateVaultComplete'})
  }

  // show initialize screen
  if (!props.isInitialized || props.forgottenPassword) {
    // show current view
    log.debug('rendering an initialize screen')
    switch (props.currentView.name) {

      case 'restoreVault':
        log.debug('rendering restore vault screen')
        return h(HDRestoreVaultScreen, {key: 'HDRestoreVaultScreen'})

      default:
        log.debug('rendering menu screen')
        return h(InitializeMenuScreen, {key: 'menuScreenInit'})
    }
  }

  // show unlock screen
  if (!props.isUnlocked) {
    switch (props.currentView.name) {

      case 'restoreVault':
        log.debug('rendering restore vault screen')
        return h(HDRestoreVaultScreen, {key: 'HDRestoreVaultScreen'})

      case 'config':
        log.debug('rendering config screen from unlock screen.')
        return h(ConfigScreen, {key: 'config'})

      default:
        log.debug('rendering locked screen')
        return h(UnlockScreen, {key: 'locked'})
    }
  }

  // show current view
  switch (props.currentView.name) {

    case 'accountDetail':
      log.debug('rendering main container')
      return h(MainContainer, {key: 'account-detail'})

    case 'sendTransaction':
      log.debug('rendering send tx screen')
      return h(SendTransactionScreen, {key: 'send-transaction'})

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
      return h(ConfigScreen, {key: 'config'})

    case 'import-menu':
      log.debug('rendering import screen')
      return h(Import, {key: 'import-menu'})

    case 'reveal-seed-conf':
      log.debug('rendering reveal seed confirmation screen')
      return h(RevealSeedConfirmation, {key: 'reveal-seed-conf'})

    case 'info':
      log.debug('rendering info screen')
      return h(InfoScreen, {key: 'info'})

    case 'buyEth':
      log.debug('rendering buy ether screen')
      return h(BuyView, {key: 'buyEthView'})

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
          h(QrView, {key: 'qr'}),
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

App.prototype.renderCustomOption = function (provider) {
  const { rpcTarget, type } = provider
  const props = this.props

  if (type !== 'rpc') return null

  // Concatenate long URLs
  let label = rpcTarget
  if (rpcTarget.length > 31) {
    label = label.substr(0, 34) + '...'
  }

  switch (rpcTarget) {

    case 'http://localhost:8545':
      return null

    default:
      return h(
        DropdownMenuItem,
        {
          key: rpcTarget,
          onClick: () => props.dispatch(actions.setRpcTarget(rpcTarget)),
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        },
        [
          h('i.fa.fa-question-circle.fa-lg.menu-icon'),
          label,
          h('.check', '✓'),
        ]
      )
  }
}

App.prototype.getNetworkName = function () {
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

App.prototype.renderCommonRpc = function (rpcList, provider) {
  const props = this.props
  const rpcTarget = provider.rpcTarget

  return rpcList.map((rpc) => {
    if ((rpc === 'http://localhost:8545') || (rpc === rpcTarget)) {
      return null
    } else {

      return h(
        DropdownMenuItem,
        {
          key: `common${rpc}`,
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
          onClick: () => props.dispatch(actions.setRpcTarget(rpc)),
        },
        [
          h('i.fa.fa-question-circle.fa-lg.menu-icon'),
          rpc,
          rpcTarget === rpc ? h('.check', '✓') : null,
        ]
      )
    }
  })
}
