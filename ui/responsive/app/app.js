const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('./actions')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
// init
const InitializeMenuScreen = require('./first-time/init-menu')
const NewKeyChainScreen = require('./new-keychain')
// unlock
const UnlockScreen = require('./unlock')
// accounts
const AccountsScreen = require('./accounts')
const AccountDetailScreen = require('./account-detail')
const SendTransactionScreen = require('./send')
const ConfirmTxScreen = require('./conf-tx')
// notice
const NoticeScreen = require('./components/notice')
const generateLostAccountsNotice = require('../lib/lost-accounts-notice')
// other views
const ConfigScreen = require('./config')
const AddTokenScreen = require('./add-token')
const Import = require('./accounts/import')
const InfoScreen = require('./info')
const Loading = require('./components/loading')
const SandwichExpando = require('sandwich-expando')
const MenuDroppo = require('menu-droppo')
const DropMenuItem = require('./components/drop-menu-item')
import { Dropdown, DropdownMenuItem } from './components/dropdown';
const NetworkIndicator = require('./components/network')
const Tooltip = require('./components/tooltip')
const BuyView = require('./components/buy-button-subview')
const QrView = require('./components/qr-code')
const HDCreateVaultComplete = require('./keychains/hd/create-vault-complete')
const HDRestoreVaultScreen = require('./keychains/hd/restore-vault')
const RevealSeedConfirmation = require('./keychains/hd/recover-seed/confirmation')

module.exports = connect(mapStateToProps)(App)

inherits(App, Component)
function App () { Component.call(this) }

function mapStateToProps (state) {
  return {
    // state from plugin
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
  const { isLoading, loadingMessage, transForward, network } = props
  const isLoadingNetwork = network === 'loading' && props.currentView.name !== 'config'
  const loadMessage = loadingMessage || isLoadingNetwork ?
    `Connecting to ${this.getNetworkName()}` : null

  log.debug('Main ui render function')

  return (

    h('.flex-column.flex-grow.full-height', {
      style: {
        // Windows was showing a vertical scroll bar:
        overflow: 'hidden',
        position: 'relative',
      },
    }, [

      // app bar
      this.renderAppBar(),
      this.renderNetworkDropdown(),
      this.renderDropdown(),

      h(Loading, {
        isLoading: isLoading || isLoadingNetwork,
        loadingMessage: loadMessage,
      }),

      // panel content
      h('.app-primary.flex-grow' + (transForward ? '.from-right' : '.from-left'), [
        h(ReactCSSTransitionGroup, {
          className: 'css-transition-group',
          transitionName: 'main',
          transitionEnterTimeout: 300,
          transitionLeaveTimeout: 300,
        }, [
          this.renderPrimary(),
        ]),
      ]),
    ])
  )
}

App.prototype.renderAppBar = function () {
  if (window.METAMASK_UI_TYPE === 'notification') {
    return null
  }

  const props = this.props
  const state = this.state || {}
  const isNetworkMenuOpen = state.isNetworkMenuOpen || false

  return (

    h('div', [

      h('.app-header.flex-row.flex-space-between', {
        style: {
          alignItems: 'center',
          visibility: props.isUnlocked ? 'visible' : 'none',
          background: props.isUnlocked ? 'white' : 'none',
          height: '36px',
          position: 'relative',
          zIndex: 12,
        },
      }, [

        h('div.left-menu-section', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          },
        }, [

          // mini logo
          h('img', {
            height: 24,
            width: 24,
            src: '/images/icon-128.png',
          }),

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

        // metamask name
        props.isUnlocked && h('h1', {
          style: {
            position: 'relative',
            left: '9px',
          },
        }, 'MetaMask'),

        props.isUnlocked && h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          },
        }, [

          // small accounts nav
          props.isUnlocked && h(Tooltip, { title: 'Switch Accounts' }, [
            h('img.cursor-pointer.color-orange', {
              src: 'images/switch_acc.svg',
              style: {
                width: '23.5px',
                marginRight: '8px',
              },
              onClick: (event) => {
                event.stopPropagation()
                this.props.dispatch(actions.showAccountsPage())
              },
            }),
          ]),

          // hamburger
          props.isUnlocked && h(SandwichExpando, {
            width: 16,
            barHeight: 2,
            padding: 0,
            isOpen: state.isMainMenuOpen,
            color: 'rgb(247,146,30)',
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              this.setState({ isMainMenuOpen: !state.isMainMenuOpen })
            },
          }),
        ]),
      ]),
    ])
  )
}

App.prototype.renderNetworkDropdown = function () {
  const props = this.props
  const rpcList = props.frequentRpcList
  const state = this.state || {}
  const isOpen = state.isNetworkMenuOpen

  return h(MenuDroppo, {
    isOpen,
    onClickOutside: (event) => {
      this.setState({ isNetworkMenuOpen: !isOpen })
    },
    zIndex: 11,
    style: {
      position: 'absolute',
      left: 0,
      top: '36px',
    },
    innerStyle: {
      background: 'white',
      boxShadow: '1px 1px 2px rgba(0,0,0,0.1)',
    },
  }, [ // DROP MENU ITEMS
    h('style', `
      .drop-menu-item:hover { background:rgb(235, 235, 235); }
      .drop-menu-item i { margin: 11px; }
    `),

    h(DropMenuItem, {
      label: 'Main Ethereum Network',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
      action: () => props.dispatch(actions.setProviderType('mainnet')),
      icon: h('.menu-icon.diamond'),
      activeNetworkRender: props.network,
      provider: props.provider,
    }),

    h(DropMenuItem, {
      label: 'Ropsten Test Network',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
      action: () => props.dispatch(actions.setProviderType('ropsten')),
      icon: h('.menu-icon.red-dot'),
      activeNetworkRender: props.network,
      provider: props.provider,
    }),

    h(DropMenuItem, {
      label: 'Kovan Test Network',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false}),
      action: () => props.dispatch(actions.setProviderType('kovan')),
      icon: h('.menu-icon.hollow-diamond'),
      activeNetworkRender: props.network,
      provider: props.provider,
    }),

    h(DropMenuItem, {
      label: 'Rinkeby Test Network',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false}),
      action: () => props.dispatch(actions.setProviderType('rinkeby')),
      icon: h('.menu-icon.golden-square'),
      activeNetworkRender: props.network,
      provider: props.provider,
    }),

    h(DropMenuItem, {
      label: 'Localhost 8545',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
      action: () => props.dispatch(actions.setDefaultRpcTarget(rpcList)),
      icon: h('i.fa.fa-question-circle.fa-lg'),
      activeNetworkRender: props.provider.rpcTarget,
    }),

    this.renderCustomOption(props.provider),
    this.renderCommonRpc(rpcList, props.provider),

    h(DropMenuItem, {
      label: 'Custom RPC',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
      action: () => this.props.dispatch(actions.showConfigPage()),
      icon: h('i.fa.fa-question-circle.fa-lg'),
    }),

  ])
}

App.prototype.renderDropdown = function () {
  const state = this.state || {}
  const isOpen = state.isMainMenuOpen

  return h(Dropdown, {
    isOpen: isOpen,
    zIndex: 11,
    onClickOutside: (event) => {
      this.setState({ isMainMenuOpen: !isOpen })
    },
    style: {
      position: 'absolute',
      right: 0,
      top: '36px',
    },
    innerStyle: {},
  }, [ // DROP MENU ITEMS
    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => this.props.dispatch(actions.showConfigPage()),
    }, 'Settings'),

    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => this.props.dispatch(actions.showImportPage()),
    }, 'Import Account'),

    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => this.props.dispatch(actions.lockMetamask()),
    }, 'Lock'),

    h(DropdownMenuItem, {
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      onClick: () => this.props.dispatch(actions.showInfoPage()),
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

    case 'accounts':
      log.debug('rendering accounts screen')
      return h(AccountsScreen, {key: 'accounts'})

    case 'accountDetail':
      log.debug('rendering account detail screen')
      return h(AccountDetailScreen, {key: 'account-detail'})

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
      return h(AccountDetailScreen, {key: 'account-detail'})
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
      return h(DropMenuItem, {
        label,
        key: rpcTarget,
        closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        icon: h('i.fa.fa-question-circle.fa-lg'),
        activeNetworkRender: 'custom',
      })
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
  const { rpcTarget } = provider
  const props = this.props

  return rpcList.map((rpc) => {
    if ((rpc === 'http://localhost:8545') || (rpc === rpcTarget)) {
      return null
    } else {
      return h(DropMenuItem, {
        label: rpc,
        key: rpc,
        closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        action: () => props.dispatch(actions.setRpcTarget(rpc)),
        icon: h('i.fa.fa-question-circle.fa-lg'),
        activeNetworkRender: rpc,
      })
    }
  })
}
