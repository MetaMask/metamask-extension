const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../ui/app/actions')
const log = require('loglevel')
// mascara
const MascaraFirstTime = require('../../mascara/src/app/first-time').default
const MascaraBuyEtherScreen = require('../../mascara/src/app/first-time/buy-ether-screen').default
// init
const InitializeMenuScreen = require('./first-time/init-menu')
const NewKeyChainScreen = require('./new-keychain')
// unlock
const UnlockScreen = require('./unlock')
// accounts
const AccountDetailScreen = require('./account-detail')
const SendTransactionScreen = require('./send')
const ConfirmTxScreen = require('./conf-tx')
// notice
const NoticeScreen = require('./components/notice')
const generateLostAccountsNotice = require('../lib/lost-accounts-notice')
// other views
const ConfigScreen = require('./config')
const AddTokenScreen = require('./components/add-token')
const ConfirmAddTokenScreen = require('./components/confirm-add-token')
const RemoveTokenScreen = require('./remove-token')
const Import = require('./accounts/import')
const InfoScreen = require('./info')
const Loading = require('./components/loading')
const Dropdown = require('./components/dropdown').Dropdown
const DropdownMenuItem = require('./components/dropdown').DropdownMenuItem
const NetworkIndicator = require('./components/network')
const BuyView = require('./components/buy-button-subview')
const QrView = require('./components/qr-code')
const HDCreateVaultComplete = require('./keychains/hd/create-vault-complete')
const HDRestoreVaultScreen = require('./keychains/hd/restore-vault')
const RevealSeedConfirmation = require('./keychains/hd/recover-seed/confirmation')
const AccountDropdowns = require('./components/account-dropdowns').AccountDropdowns
const DeleteRpc = require('./components/delete-rpc')
const DeleteImportedAccount = require('./components/delete-imported-account')
const ConfirmChangePassword = require('./components/confirm-change-password')
const ethNetProps = require('eth-net-props')

module.exports = connect(mapStateToProps)(App)

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
    featureFlags,
  } = state.metamask
  const selected = address || Object.keys(accounts)[0]

  return {
    // state from plugin
    isLoading: state.appState.isLoading,
    loadingMessage: state.appState.loadingMessage,
    noActiveNotices: state.metamask.noActiveNotices,
    isInitialized: state.metamask.isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    currentView: state.appState.currentView,
    selectedAddress: state.metamask.selectedAddress,
    transForward: state.appState.transForward,
    isMascara: state.metamask.isMascara,
    isOnboarding: Boolean(!noActiveNotices || seedWords || !isInitialized),
    seedWords: state.metamask.seedWords,
    unapprovedTxs: state.metamask.unapprovedTxs,
    unapprovedMsgs: state.metamask.unapprovedMsgs,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.appState.forgottenPassword,
    nextUnreadNotice: state.metamask.nextUnreadNotice,
    lostAccounts: state.metamask.lostAccounts,
    frequentRpcList: state.metamask.frequentRpcList || [],
    featureFlags,

    // state needed to get account dropdown temporarily rendering from app bar
    identities,
    selected,
    keyrings,
  }
}

App.prototype.render = function () {
  var props = this.props
  const { isLoading, loadingMessage, transForward, network, provider } = props
  const isLoadingNetwork = network === 'loading' && props.currentView.name !== 'config' && props.currentView.name !== 'delete-rpc'
  const networkName = provider.type === 'rpc' ? `${this.getNetworkName()} (${provider.rpcTarget})` : this.getNetworkName()
  const loadMessage = loadingMessage || isLoadingNetwork ?
    `Connecting to ${networkName}` : null
  log.debug('Main ui render function')

  return (
    h('.flex-column.full-height', {
      style: {
        // Windows was showing a vertical scroll bar:
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        background: (props.isUnlocked || props.currentView.name === 'restoreVault' || props.currentView.name === 'config') ? 'white' : 'linear-gradient(rgb(84, 36, 147), rgb(104, 45, 182))',
      },
    }, [

      // app bar
      this.renderAppBar(),
      this.renderNetworkDropdown(),
      this.renderDropdown(),

      this.renderLoadingIndicator({ isLoading, isLoadingNetwork, loadMessage }),

      // panel content
      h('.app-primary' + (transForward ? '.from-right' : '.from-left'), {
        style: {
          background: (props.isUnlocked || props.currentView.name === 'restoreVault' || props.currentView.name === 'config') ? 'white' : 'transparent',
        },
      }, [
        this.renderPrimary(),
      ]),
    ])
  )
}

App.prototype.changeState = function (isMainMenuOpen) {
  this.setState({
    isMainMenuOpen,
    sandwichClass: isMainMenuOpen ? 'sandwich-expando expanded' : 'sandwich-expando',
  })
}

App.prototype.renderAppBar = function () {
  if (window.METAMASK_UI_TYPE === 'notification') {
    return null
  }

  const props = this.props
  const state = this.state || {}
  const isNetworkMenuOpen = state.isNetworkMenuOpen || false
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
      height: '38px',
    }, [

      h('.app-header.flex-row.flex-space-between', {
        style: {
          alignItems: 'center',
          visibility: props.isUnlocked ? 'visible' : 'none',
          background: 'white',
          height: '38px',
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
            src: './images/icon-128.png',
          }),

          h(NetworkIndicator, {
            network: this.props.network,
            provider: this.props.provider,
            isUnlocked: this.props.isUnlocked,
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
            },
          }),

        ]),

        props.isUnlocked && h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          },
        }, [
          h(AccountDropdowns, {
            style: {},
            enableAccountsSelector: true,
            identities: this.props.identities,
            selected: this.props.selectedAddress,
            network: this.props.network,
            keyrings: this.props.keyrings,
          }, []),

          // hamburger
          h('div', {
            className: state.sandwichClass || 'sandwich-expando',
            style: {
              width: 16,
              height: 16,
              padding: 0,
            },
            onClick: () => this.changeState(!state.isMainMenuOpen),
          }),
        ]),
      ]),
    ])
  )
}

App.prototype.renderNetworkDropdown = function () {
  const props = this.props
  const { provider: { type: providerType } } = props
  const rpcList = props.frequentRpcList
  const state = this.state || {}
  const isOpen = state.isNetworkMenuOpen

  return h(Dropdown, {
    useCssTransition: true,
    isOpen,
    onClickOutside: (event) => {
      const { classList } = event.target
      const isNotToggleElement = [
        classList.contains('menu-icon'),
        classList.contains('network-name'),
        classList.contains('network-indicator'),
      ].filter(bool => bool).length === 0
      // classes from three constituent nodes of the toggle element

      if (isNotToggleElement) {
        this.setState({ isNetworkMenuOpen: false })
      }
    },
    zIndex: 11,
    style: {
      position: 'absolute',
      left: '2px',
      top: '38px',
      width: '270px',
      maxHeight: isOpen ? '524px' : '0px',
    },
    innerStyle: {
      padding: '2px 16px 2px 0px',
    },
  }, [

    h(
      DropdownMenuItem,
      {
        key: 'poa',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('poa')),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'poa' ? 'white' : '',
        },
      },
      [h(providerType === 'poa' ? 'div.selected-network' : ''),
        ethNetProps.props.getNetworkDisplayName(99),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'sokol',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('sokol')),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'sokol' ? 'white' : '',
        },
      },
      [h(providerType === 'sokol' ? 'div.selected-network' : ''),
        ethNetProps.props.getNetworkDisplayName(77),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'main',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('mainnet')),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'mainnet' ? 'white' : '',
        },
      },
      [h(providerType === 'mainnet' ? 'div.selected-network' : ''),
        ethNetProps.props.getNetworkDisplayName(1),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'ropsten',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('ropsten')),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'ropsten' ? 'white' : '',
        },
      },
      [h(providerType === 'ropsten' ? 'div.selected-network' : ''),
        ethNetProps.props.getNetworkDisplayName(3),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'kovan',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('kovan')),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'kovan' ? 'white' : '',
        },
      },
      [h(providerType === 'kovan' ? 'div.selected-network' : ''),
        ethNetProps.props.getNetworkDisplayName(42),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'rinkeby',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => props.dispatch(actions.setProviderType('rinkeby')),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'rinkeby' ? 'white' : '',
        },
      },
      [h(providerType === 'rinkeby' ? 'div.selected-network' : ''),
        ethNetProps.props.getNetworkDisplayName(4),
      ]
    ),

    h(
      DropdownMenuItem,
      {
        key: 'default',
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => {
          props.dispatch(actions.setRpcTarget('http://localhost:8545'))
          props.dispatch(actions.setProviderType('localhost'))
        },
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: providerType === 'localhost' ? 'white' : '',
        },
      },
      [h(providerType === 'localhost' ? 'div.selected-network' : ''),
        'Localhost 8545',
      ]
    ),

    h(
      DropdownMenuItem,
      {
        closeMenu: () => this.setState({ isNetworkMenuOpen: !isOpen }),
        onClick: () => this.props.dispatch(actions.showConfigPage()),
        style: {
          paddingLeft: '20px',
          fontSize: '16px',
          color: '#60db97',
        },
      },
      [
        'Custom RPC',
      ]
    ),

    this.renderSelectedCustomOption(props.provider),
    this.renderCommonRpc(rpcList, props.provider),

  ])
}

App.prototype.renderDropdown = function () {
  const state = this.state || {}
  const isOpen = state.isMainMenuOpen
  const isMainMenuOpen = !isOpen

  return h(Dropdown, {
    useCssTransition: true,
    isOpen: isOpen,
    zIndex: 11,
    constOverflow: true,
    onClickOutside: (event) => {
      const classList = event.target.classList
      const parentClassList = event.target.parentElement.classList

      const isToggleElement = classList.contains('sandwich-expando') ||
        parentClassList.contains('sandwich-expando')

      if (isOpen && !isToggleElement) {
        this.setState({
          isMainMenuOpen: false,
          sandwichClass: 'sandwich-expando',
        })
      }
    },
    style: {
      position: 'absolute',
      right: '2px',
      top: '38px',
      width: '126px',
      maxHeight: isOpen ? '186px' : '0px',
      overflow: 'hidden',
    },
    innerStyle: {},
  }, [
    h(DropdownMenuItem, {
      closeMenu: () => this.changeState(isMainMenuOpen),
      onClick: () => { this.props.dispatch(actions.showConfigPage()) },
    }, 'Settings'),

    h(DropdownMenuItem, {
      closeMenu: () => this.changeState(isMainMenuOpen),
      onClick: () => { this.props.dispatch(actions.lockMetamask()) },
    }, 'Log Out'),

    h(DropdownMenuItem, {
      closeMenu: () => this.changeState(isMainMenuOpen),
      onClick: () => { this.props.dispatch(actions.showInfoPage()) },
    }, 'Info/Help'),
  ])
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
  const {isMascara, isOnboarding} = props

  if (isMascara && isOnboarding) {
    return h(MascaraFirstTime)
  }

  // notices
  if (!props.noActiveNotices) {
    log.debug('rendering notice screen for unread notices.')
    return h('div', {
      style: { width: '100%' },
    }, [

      h(NoticeScreen, {
        notice: props.nextUnreadNotice,
        key: 'NoticeScreen',
        onConfirm: () => props.dispatch(actions.markNoticeRead(props.nextUnreadNotice)),
      }),

    ])
  } else if (props.lostAccounts && props.lostAccounts.length > 0) {
    log.debug('rendering notice screen for lost accounts view.')
    return h(NoticeScreen, {
      notice: generateLostAccountsNotice(props.lostAccounts),
      key: 'LostAccountsNotice',
      onConfirm: () => props.dispatch(actions.markAccountsFound()),
    })
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

  // show seed words screen
  if (props.seedWords) {
    log.debug('rendering seed words')
    return h(HDCreateVaultComplete, {key: 'HDCreateVaultComplete'})
  }

  // show current view
  switch (props.currentView.name) {

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

    case 'confirm-add-token':
      log.debug('rendering confirm-add-token screen from unlock screen.')
      return h(ConfirmAddTokenScreen, {key: 'confirm-add-token'})

    case 'remove-token':
      log.debug('rendering remove-token screen from unlock screen.')
      return h(RemoveTokenScreen, {key: 'remove-token', ...props.currentView.context })

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

    case 'onboardingBuyEth':
      log.debug('rendering onboarding buy ether screen')
      return h(MascaraBuyEtherScreen, {key: 'buyEthView'})

    case 'qr':
      log.debug('rendering show qr screen')
      return h('div', {
        style: {
          height: '100%',
          top: '0px',
          left: '0px',
          width: '100%',
        },
      }, [
        h('.section-title.flex-row.flex-center', [
          h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
            onClick: () => props.dispatch(actions.backToAccountDetail(props.selectedAddress)),
            style: {
              marginLeft: '30px',
              marginTop: '5px',
              position: 'absolute',
              left: '0',
            },
          }),
          h('h2.page-subtitle', {
            style: {
              fontFamily: 'Nunito SemiBold',
              marginTop: '10px',
              marginBottom: '0px',
              textAlign: 'center',
            },
          }, 'QR Code'),
        ]),
        h('div', [
          h(QrView, {key: 'qr'}),
        ]),
      ])
    case 'delete-rpc':
      log.debug('rendering delete rpc confirmation screen')
      return h(DeleteRpc, {key: 'delete-rpc'})
    case 'delete-imported-account':
      log.debug('rendering delete imported account confirmation screen')
      return h(DeleteImportedAccount, {key: 'delete-imported-account'})
    case 'confirm-change-password':
      log.debug('rendering confirm password changing screen')
      return h(ConfirmChangePassword, {key: 'confirm-change-password'})
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

App.prototype.renderSelectedCustomOption = function (provider) {
  const { rpcTarget, type } = provider
  const props = this.props
  if (type !== 'rpc') return null

  // Concatenate long URLs
  let label = rpcTarget
  if (rpcTarget.length > 31) {
    label = label.substr(0, 34) + '...'
  }

  switch (rpcTarget) {

    default:
      return h(
        DropdownMenuItem,
        {
          key: rpcTarget,
          onClick: () => props.dispatch(actions.setRpcTarget(rpcTarget)),
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
            color: 'white',
          },
        },
        [h('div.selected-network'),
          h('.span.custom-rpc', label),
          h('.remove', {
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              this.setState({ isNetworkMenuOpen: false })
              props.dispatch(actions.showDeleteRPC(label))
            },
          }),
        ]
      )
  }
}

App.prototype.getNetworkName = function () {
  const { network } = this.props
  return ethNetProps.props.getNetworkDisplayName(network)
}

App.prototype.renderCommonRpc = function (rpcList, provider) {
  const props = this.props
  const { rpcTarget, type } = provider

  return rpcList.map((rpc) => {
    if (type === 'rpc' && rpc === rpcTarget) {
      return null
    } else {
      return h(
        DropdownMenuItem,
        {
          key: `common${rpc}`,
          closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
          onClick: () => props.dispatch(actions.setRpcTarget(rpc)),
          style: {
            paddingLeft: '20px',
            fontSize: '16px',
          },
        },
        [
          h('.span.custom-rpc', rpc),
          h('.remove', {
            onClick: (event) => {
              event.preventDefault()
              event.stopPropagation()
              this.setState({ isNetworkMenuOpen: false })
              props.dispatch(actions.showDeleteRPC(rpc))
            },
          }),
        ]
      )
    }
  })
}
