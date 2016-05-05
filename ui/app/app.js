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
const InfoScreen = require('./info')
const LoadingIndicator = require('./loading')
const txHelper = require('../lib/tx-helper')

module.exports = connect(mapStateToProps)(App)


inherits(App, Component)
function App() { Component.call(this) }

function mapStateToProps(state) {
  return {
    // state from plugin
    isInitialized: state.metamask.isInitialized,
    isUnlocked: state.metamask.isUnlocked,
    currentView: state.appState.currentView,
    activeAddress: state.appState.activeAddress,
    transForward: state.appState.transForward,
    seedWords: state.metamask.seedWords,
    unconfTxs: state.metamask.unconfTxs,
    unconfMsgs: state.metamask.unconfMsgs,
  }
}

App.prototype.render = function() {
  // const { selectedReddit, posts, isFetching, lastUpdated } = this.props
  var state = this.props
  var view = state.currentView.name
  var transForward = state.transForward
  var shouldHaveFooter = true
  switch (view) {
    case 'restoreVault':
      shouldHaveFooter = false;
    case 'createVault':
      shouldHaveFooter = false;
    case 'createVaultComplete':
      shouldHaveFooter = false;
  }

  return (

    h('.flex-column.flex-grow.full-height', {
      style: {
        // Windows was showing a vertical scroll bar:
        overflow: 'hidden',
      }
    },
    [

      h(LoadingIndicator),

      // top row
      h('.app-header.flex-column.flex-center', {
      }, [
        h('h1', 'MetaMask'),
      ]),

      // panel content
      h('.app-primary.flex-grow' + (transForward ? '.from-right' : '.from-left'), {
        style: {
          height: '380px',
          width: '360px',
        }
      }, [
        h(ReactCSSTransitionGroup, {
          transitionName: "main",
          transitionEnterTimeout: 300,
          transitionLeaveTimeout: 300,
        }, [
          this.renderPrimary(),
        ]),
      ]),

      // footer
      h('.app-footer.flex-row.flex-space-around', {
        style: {
          display: shouldHaveFooter ? 'flex' : 'none',
          alignItems: 'center',
          height: '56px',
        }
      }, [

        // settings icon
        h('i.fa.fa-cog.fa-lg' + (view  === 'config' ? '.active' : '.cursor-pointer'), {
          style: {
            opacity: state.isUnlocked ? '1.0' : '0.0',
            transition: 'opacity 200ms ease-in',
            //transform: `translateX(${state.isUnlocked ? '0px' : '-100px'})`,
          },
          onClick: function(ev) {
            state.dispatch(actions.showConfigPage())
          },
        }),

        // toggle
        onOffToggle({
          toggleMetamaskActive: this.toggleMetamaskActive.bind(this),
          isUnlocked: state.isUnlocked,
        }),

        // help
        h('i.fa.fa-question.fa-lg.cursor-pointer', {
          style: {
            opacity: state.isUnlocked ? '1.0' : '0.0',
          },
          onClick() { state.dispatch(actions.showInfoPage()) }
        }),
      ]),
    ])
  )
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

App.prototype.renderPrimary = function(state){
  var state = this.props

  // If seed words haven't been dismissed yet, show them still.
  /*
  if (state.seedWords) {
    return h(CreateVaultCompleteScreen, {key: 'createVaultComplete'})
  }
  */

  // show initialize screen
  if (!state.isInitialized) {

    // show current view
    switch (state.currentView.name) {

      case 'createVault':
        return h(CreateVaultScreen, {key: 'createVault'})

      case 'restoreVault':
        return h(RestoreVaultScreen, {key: 'restoreVault'})

      default:
        return h(InitializeMenuScreen, {key: 'menuScreenInit'})

    }
  }

  // show unlock screen
  if (!state.isUnlocked) {
    return h(UnlockScreen, {key: 'locked'})
  }

  // show current view
  switch (state.currentView.name) {

    case 'createVaultComplete':
      return h(CreateVaultCompleteScreen, {key: 'created-vault'})

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

    case 'info':
      return h(InfoScreen, {key: 'info'})

    case 'createVault':
      return h(CreateVaultScreen, {key: 'createVault'})

    default:
      if (this.hasPendingTxs()) {
        return h(ConfirmTxScreen, {key: 'confirm-tx'})
      } else {
        return h(AccountDetailScreen, {key: 'account-detail'})
      }
   }
}

App.prototype.hasPendingTxs = function() {
  var state = this.props
  var unconfTxs = state.unconfTxs
  var unconfMsgs = state.unconfMsgs
  var unconfTxList = txHelper(unconfTxs, unconfMsgs)
  return unconfTxList.length > 0
}

function onOffToggle(state){
  var buttonSize = '50px';
  var lockWidth = '20px';
  return (
    h('.app-toggle.flex-row.flex-center.lock' + (state.isUnlocked ? '.unlocked' : '.locked'), {
      width: buttonSize,
      height: buttonSize,
    }, [
      h('div', {
        onClick: state.toggleMetamaskActive,
        style: {
          width: lockWidth,
          height: '' + parseInt(lockWidth) * 1.5 + 'px',
          position: 'relative',
        }
      }, [
        h('img.lock-top', {
          src: 'images/lock-top.png',
          style: {
            width: lockWidth,
            position: 'absolute',
          }
        }),
        h('img', {
          src: 'images/lock-base.png',
          style: {
            width: lockWidth,
            position: 'absolute',
          }
        }),
      ])
    ])
  )
}
