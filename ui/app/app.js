const inherits = require('util').inherits
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('./actions')
const ReactCSSTransitionGroup = require('react-addons-css-transition-group')
// init
const DisclaimerScreen = require('./first-time/disclaimer')
const InitializeMenuScreen = require('./first-time/init-menu')
const CreateVaultScreen = require('./first-time/create-vault')
const CreateVaultCompleteScreen = require('./first-time/create-vault-complete')
const RestoreVaultScreen = require('./first-time/restore-vault')
// unlock
const UnlockScreen = require('./unlock')
// accounts
const AccountsScreen = require('./accounts')
const AccountDetailScreen = require('./account-detail')
const SendTransactionScreen = require('./send')
const ConfirmTxScreen = require('./conf-tx')
// other views
const ConfigScreen = require('./config')
const RevealSeedConfirmation = require('./recover-seed/confirmation')
const InfoScreen = require('./info')
const LoadingIndicator = require('./components/loading')
const SandwichExpando = require('sandwich-expando')
const MenuDroppo = require('menu-droppo')
const DropMenuItem = require('./components/drop-menu-item')
const NetworkIndicator = require('./components/network')
const Tooltip = require('./components/tooltip')
const EthStoreWarning = require('./eth-store-warning')
const BuyView = require('./components/buy-button-subview')
const QrView = require('./components/qr-code')
module.exports = connect(mapStateToProps)(App)

inherits(App, Component)
function App () { Component.call(this) }

function mapStateToProps (state) {
  return {
    // state from plugin
    isLoading: state.appState.isLoading,
    isConfirmed: state.metamask.isConfirmed,
    isEthConfirmed: state.metamask.isEthConfirmed,
    isInitialized: state.metamask.isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    seedWords: state.metamask.seedWords,
    unconfTxs: state.metamask.unconfTxs,
    unconfMsgs: state.metamask.unconfMsgs,
    menuOpen: state.appState.menuOpen,
    network: state.metamask.network,
    provider: state.metamask.provider,
    forgottenPassword: state.appState.forgottenPassword,
  }
}

App.prototype.render = function () {
  var props = this.props
  const { isLoading, transForward } = props

  return (

    h('.flex-column.flex-grow.full-height', {
      style: {
        // Windows was showing a vertical scroll bar:
        overflow: 'hidden',
        position: 'relative',
      },
    }, [

      h(LoadingIndicator, { isLoading }),

      // app bar
      this.renderAppBar(),
      this.renderNetworkDropdown(),
      this.renderDropdown(),

      // panel content
      h('.app-primary.flex-grow' + (transForward ? '.from-right' : '.from-left'), {
        style: {
          height: '380px',
          width: '360px',
        },
      }, [
        h(ReactCSSTransitionGroup, {
          className: 'css-transition-group',
          transitionName: 'main',
          transitionEnterTimeout: 300,
          transitionLeaveTimeout: 300,
        }, [
          this.renderPrimary(),
          this.renderBackToInitButton(),
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
          zIndex: 2,
        },
      }, props.isUnlocked && [

        h('div', {
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
        h('h1', {
          style: {
            position: 'relative',
            left: '9px',
          },
        }, 'MetaMask'),

        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
          },
        }, [

          // small accounts nav
          h(Tooltip, { title: 'Switch Accounts' }, [
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
          h(SandwichExpando, {
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
  const state = this.state || {}
  const isOpen = state.isNetworkMenuOpen

  return h(MenuDroppo, {
    isOpen,
    onClickOutside: (event) => {
      this.setState({ isNetworkMenuOpen: !isOpen })
    },
    zIndex: 1,
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
      action: () => props.dispatch(actions.setProviderType('testnet')),
      icon: h('.menu-icon.red-dot'),
      activeNetworkRender: props.network,
      provider: props.provider,
    }),

    h(DropMenuItem, {
      label: 'Morden Test Network',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
      action: () => props.dispatch(actions.setProviderType('morden')),
      icon: h('.menu-icon.red-dot'),
      activeNetworkRender: props.network,
      provider: props.provider,
    }),

    h(DropMenuItem, {
      label: 'Localhost 8545',
      closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
      action: () => props.dispatch(actions.setRpcTarget('http://localhost:8545')),
      icon: h('i.fa.fa-question-circle.fa-lg'),
      activeNetworkRender: props.provider.rpcTarget,
    }),

    this.renderCustomOption(props.provider.rpcTarget),
  ])
}

App.prototype.renderDropdown = function () {
  const state = this.state || {}
  const isOpen = state.isMainMenuOpen

  return h(MenuDroppo, {
    isOpen: isOpen,
    zIndex: 1,
    onClickOutside: (event) => {
      this.setState({ isMainMenuOpen: !isOpen })
    },
    style: {
      position: 'absolute',
      right: 0,
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
      label: 'Settings',
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      action: () => this.props.dispatch(actions.showConfigPage()),
      icon: h('i.fa.fa-gear.fa-lg'),
    }),

    h(DropMenuItem, {
      label: 'Lock',
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      action: () => this.props.dispatch(actions.lockMetamask()),
      icon: h('i.fa.fa-lock.fa-lg'),
    }),

    h(DropMenuItem, {
      label: 'Info',
      closeMenu: () => this.setState({ isMainMenuOpen: !isOpen }),
      action: () => this.props.dispatch(actions.showInfoPage()),
      icon: h('i.fa.fa-question.fa-lg'),
    }),
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
App.prototype.renderBackToInitButton = function () {
  var props = this.props
  var button = null
  if (!props.isConfirmed) return button
  if (!props.isUnlocked) {
    if (props.currentView.name === 'InitMenu') {
      button = props.forgottenPassword ? h('.flex-row', {
        key: 'rightArrow',
        style: {
          position: 'absolute',
          bottom: '10px',
          right: '15px',
          fontSize: '21px',
          fontFamily: 'Montserrat Light',
          color: '#7F8082',
          width: '77.578px',
          alignItems: 'flex-end',
        },
      }, [
        h('div.cursor-pointer', {
          style: {
            marginRight: '3px',
          },
          onClick: () => props.dispatch(actions.backToUnlockView()),
        }, 'LOGIN'),
        h('i.fa.fa-arrow-right.cursor-pointer'),
      ]) : null
    } else if (props.isInitialized) {
      var style
      switch (props.currentView.name) {
        case 'createVault':
          style = {
            position: 'absolute',
            top: '41px',
            left: '80px',
            fontSize: '21px',
            fontFamily: 'Montserrat Bold',
            color: 'rgb(174, 174, 174)',
          }
          return this.renderBackButton(style, true)
        case 'restoreVault':
          style = {
            position: 'absolute',
            top: '41px',
            left: '70px',
            fontSize: '21px',
            fontFamily: 'Montserrat Bold',
            color: 'rgb(174, 174, 174)',
          }
          return this.renderBackButton(style, true)
        default:
          style = {
            position: 'absolute',
            bottom: '10px',
            left: '15px',
            fontSize: '21px',
            fontFamily: 'Montserrat Light',
            color: '#7F8082',
            width: '71.969px',
            alignItems: 'flex-end',
          }
          return this.renderBackButton(style)
      }
    }
  }
  return button
}

App.prototype.renderPrimary = function () {
  var props = this.props

  if (!props.isConfirmed) {
    return h(DisclaimerScreen, {key: 'disclaimerScreen'})
  }

  if (props.seedWords) {
    return h(CreateVaultCompleteScreen, {key: 'createVaultComplete'})
  }

  // show initialize screen
  if (!props.isInitialized || props.forgottenPassword) {
    // show current view
    switch (props.currentView.name) {

      case 'createVault':
        return h(CreateVaultScreen, {key: 'createVault'})

      case 'restoreVault':
        return h(RestoreVaultScreen, {key: 'restoreVault'})

      case 'createVaultComplete':
        return h(CreateVaultCompleteScreen, {key: 'createVaultComplete'})

      default:
        return h(InitializeMenuScreen, {key: 'menuScreenInit'})

    }
  }

  // show unlock screen
  if (!props.isUnlocked) {
    return h(UnlockScreen, {key: 'locked'})
  }

  // show current view
  switch (props.currentView.name) {
    case 'EthStoreWarning':
      return h(EthStoreWarning, {key: 'ethWarning'})

    case 'accounts':
      return h(AccountsScreen, {key: 'accounts'})

    case 'accountDetail':
      return h(AccountDetailScreen, {key: 'account-detail'})

    case 'sendTransaction':
      return h(SendTransactionScreen, {key: 'send-transaction'})

    case 'confTx':
      return h(ConfirmTxScreen, {key: 'confirm-tx'})

    case 'config':
      return h(ConfigScreen, {key: 'config'})

    case 'reveal-seed-conf':
      return h(RevealSeedConfirmation, {key: 'reveal-seed-conf'})

    case 'info':
      return h(InfoScreen, {key: 'info'})

    case 'createVault':
      return h(CreateVaultScreen, {key: 'createVault'})
    case 'buyEth':
      return h(BuyView, {key: 'buyEthView'})
    case 'qr':
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

App.prototype.renderCustomOption = function (rpcTarget) {
  switch (rpcTarget) {
    case undefined:
      return h(DropMenuItem, {
        label: 'Custom RPC',
        closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        action: () => this.props.dispatch(actions.showConfigPage()),
        icon: h('i.fa.fa-question-circle.fa-lg'),
      })

    case 'http://localhost:8545':
      return h(DropMenuItem, {
        label: 'Custom RPC',
        closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        action: () => this.props.dispatch(actions.showConfigPage()),
        icon: h('i.fa.fa-question-circle.fa-lg'),
      })

    default:
      return h(DropMenuItem, {
        label: `${rpcTarget}`,
        closeMenu: () => this.setState({ isNetworkMenuOpen: false }),
        icon: h('i.fa.fa-question-circle.fa-lg'),
        activeNetworkRender: 'custom',
      })
  }
}
