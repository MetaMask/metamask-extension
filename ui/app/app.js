const inherits = require('util').inherits
const React = require('react')
const Component = require('react').Component
const PropTypes = require('react').PropTypes
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const extend = require('xtend')
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
const LoadingIndicator = require('./loading')
const txHelper = require('../lib/tx-helper')
const SandwichExpando = require('sandwich-expando')
const MenuDroppo = require('menu-droppo')
const DropMenuItem = require('./components/drop-menu-item')
const NetworkIndicator = require('./components/network')

module.exports = connect(mapStateToProps)(App)


inherits(App, Component)
function App() { Component.call(this) }

function mapStateToProps(state) {
  return {
    // state from plugin
    isConfirmed: state.metamask.isConfirmed,
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
  }
}

App.prototype.render = function() {
  var props = this.props
  var view = props.currentView.name
  var transForward = props.transForward

  return (

    h('.flex-column.flex-grow.full-height', {
      style: {
        // Windows was showing a vertical scroll bar:
        overflow: 'hidden',
      }
    }, [

      h(LoadingIndicator),

      // app bar
      this.renderAppBar(),
      this.renderNetworkDropdown(),
      this.renderDropdown(),

      // panel content
      h('.app-primary.flex-grow' + (transForward ? '.from-right' : '.from-left'), {
        style: {
          height: '380px',
          width: '360px',
        }
      }, [
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

App.prototype.renderAppBar = function(){
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
          zIndex: 1,
        },
      }, props.isUnlocked && [

        h(NetworkIndicator, {
          network: this.props.network,
          onClick:(event) => {
            event.preventDefault()
            event.stopPropagation()
            this.setState({ isNetworkMenuOpen: !isNetworkMenuOpen })
          }
        }),

        // metamask name
        h('h1', 'MetaMask'),
        // hamburger
        h(SandwichExpando, {
          width: 16,
          barHeight: 2,
          padding: 0,
          isOpen: props.menuOpen,
          color: 'rgb(247,146,30)',
          onClick: (event) => {
            event.preventDefault()
            event.stopPropagation()
            this.props.dispatch(actions.toggleMenu())
          },
        }),
      ]),
    ])
  )
}

App.prototype.renderNetworkDropdown = function() {
  const props = this.props
  const state = this.state || {}
  const isOpen = state.isNetworkMenuOpen

  const checked = h('i.fa.fa-check.fa-lg', { ariaHidden: true })

  return h(MenuDroppo, {
    isOpen,
    onClickOutside:(event) => {
      this.setState({ isNetworkMenuOpen: !isOpen })
    },
    style: {
      position: 'fixed',
      left: 0,
      zIndex: 0,
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
      closeMenu:() => this.setState({ isNetworkMenuOpen: false }),
      action:() => props.dispatch(actions.setProviderType('mainnet')),
      icon: h('.menu-icon.ether-icon'),
    }),

    h(DropMenuItem, {
      label: 'Morden Test Network',
      closeMenu:() => this.setState({ isNetworkMenuOpen: false }),
      action:() => props.dispatch(actions.setProviderType('testnet')),
      icon: h('.menu-icon.morden-icon'),
    }),

    h(DropMenuItem, {
      label: 'Localhost 8545',
      closeMenu:() => this.setState({ isNetworkMenuOpen: false }),
      action:() => props.dispatch(actions.setRpcTarget('http://localhost:8545')),
      icon: h('i.fa.fa-question-circle.fa-lg', { ariaHidden: true }),
    }),
  ])
}

App.prototype.renderDropdown = function() {
  const props = this.props
  return h(MenuDroppo, {
    isOpen: props.menuOpen,
    onClickOutside: (event) => {
      this.props.dispatch(actions.closeMenu())
    },
    style: {
      position: 'fixed',
      right: 0,
      zIndex: 0,
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
      closeMenu:() => this.props.dispatch(actions.closeMenu()),
      action:() => this.props.dispatch(actions.showConfigPage()),
      icon: h('i.fa.fa-gear.fa-lg', { ariaHidden: true }),
    }),

    h(DropMenuItem, {
      label: 'Lock',
      closeMenu:() => this.props.dispatch(actions.closeMenu()),
      action:() => this.props.dispatch(actions.lockMetamask()),
      icon: h('i.fa.fa-lock.fa-lg', { ariaHidden: true }),
    }),

    h(DropMenuItem, {
      label: 'Help',
      closeMenu:() => this.props.dispatch(actions.closeMenu()),
      action:() => this.props.dispatch(actions.showInfoPage()),
      icon: h('i.fa.fa-question.fa-lg', { ariaHidden: true }),
    }),
  ])
}

App.prototype.renderPrimary = function(){
  var props = this.props

  if (!props.isConfirmed) {
    return h(DisclaimerScreen, {key: 'disclaimerScreen'})
  }

  if (props.seedWords) {
    return h(CreateVaultCompleteScreen, {key: 'createVaultComplete'})
  }

  // show initialize screen
  if (!props.isInitialized) {

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

    default:
      return h(AccountDetailScreen, {key: 'account-detail'})
   }
}

App.prototype.toggleMetamaskActive = function(){
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

