const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const getCaretCoordinates = require('textarea-caret')
const Mascot = require('../components/mascot')
const actions = require('../actions')
const CreateVaultScreen = require('./create-vault')
const CreateVaultCompleteScreen = require('./create-vault-complete')

module.exports = connect(mapStateToProps)(InitializeMenuScreen)

inherits(InitializeMenuScreen, Component)
function InitializeMenuScreen() {
  Component.call(this)
  this.animationEventEmitter = new EventEmitter()
}

function mapStateToProps(state) {
  return {
    // state from plugin
    currentView: state.appState.currentView,
  }
}

InitializeMenuScreen.prototype.render = function() {
  var state = this.props

  switch (state.currentView.name) {

    case 'createVault':
      return h(CreateVaultScreen)

    case 'createVaultComplete':
      return h(CreateVaultCompleteScreen)

    case 'restoreVault':
      return this.renderRestoreVault()

    default:
      return this.renderMenu()

  }

}

// InitializeMenuScreen.prototype.componentDidMount = function(){
//   document.getElementById('password-box').focus()
// }

InitializeMenuScreen.prototype.renderMenu = function() {
  var state = this.props
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      h('h2.page-subtitle', 'Welcome!'),

      h(Mascot, {
        animationEventEmitter: this.animationEventEmitter,
      }),

      h('button.btn-thin', {
        onClick: this.showCreateVault.bind(this),
      }, 'Create New Vault'),

      h('.flex-row.flex-center.flex-grow', [
        h('hr'),
        h('div', 'OR'),
        h('hr'),
      ]),

      h('button.btn-thin', {
        onClick: this.showRestoreVault.bind(this),
      }, 'Restore Existing Vault'),

    ])

  )
}

InitializeMenuScreen.prototype.renderRestoreVault = function() {
  var state = this.props
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.showInitializeMenu.bind(this),
        }),
        h('h2.page-subtitle', 'Restore Vault'),
      ]),


      h('h3', 'Coming soon....'),
      // h('textarea.twelve-word-phrase', {
      //   value: 'hey ho what the actual hello rubber duck bumbersnatch crumplezone frankenfurter',
      // }),

    ])

  )
}

// InitializeMenuScreen.prototype.splitWor = function() {
//   this.props.dispatch(actions.showInitializeMenu())
// }

InitializeMenuScreen.prototype.showInitializeMenu = function() {
  this.props.dispatch(actions.showInitializeMenu())
}

InitializeMenuScreen.prototype.showCreateVault = function() {
  this.props.dispatch(actions.showCreateVault())
}

InitializeMenuScreen.prototype.showRestoreVault = function() {
  this.props.dispatch(actions.showRestoreVault())
}

