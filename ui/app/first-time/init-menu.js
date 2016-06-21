const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const Mascot = require('../components/mascot')
const actions = require('../actions')

module.exports = connect(mapStateToProps)(InitializeMenuScreen)

inherits(InitializeMenuScreen, Component)
function InitializeMenuScreen () {
  Component.call(this)
  this.animationEventEmitter = new EventEmitter()
}

function mapStateToProps (state) {
  return {
    // state from plugin
    currentView: state.appState.currentView,
  }
}

InitializeMenuScreen.prototype.render = function () {
  var state = this.props

  switch (state.currentView.name) {

    default:
      return this.renderMenu()

  }
}

// InitializeMenuScreen.prototype.componentDidMount = function(){
//   document.getElementById('password-box').focus()
// }

InitializeMenuScreen.prototype.renderMenu = function () {
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      h(Mascot, {
        animationEventEmitter: this.animationEventEmitter,
      }),

      h('h1', {
        style: {
          fontSize: '1.4em',
          textTransform: 'uppercase',
          color: '#7F8082',
          marginBottom: 20,
        },
      }, 'MetaMask'),

      h('button.primary', {
        onClick: this.showCreateVault.bind(this),
        style: {
          margin: 12,
        },
      }, 'Create New Vault'),

      h('.flex-row.flex-center.flex-grow', [
        h('hr'),
        h('div', 'OR'),
        h('hr'),
      ]),

      h('button.primary', {
        onClick: this.showRestoreVault.bind(this),
        style: {
          margin: 12,
        },
      }, 'Restore Existing Vault'),

    ])

  )
}

// InitializeMenuScreen.prototype.splitWor = function() {
//   this.props.dispatch(actions.showInitializeMenu())
// }

InitializeMenuScreen.prototype.showInitializeMenu = function () {
  this.props.dispatch(actions.showInitializeMenu())
}

InitializeMenuScreen.prototype.showCreateVault = function () {
  this.props.dispatch(actions.showCreateVault())
}

InitializeMenuScreen.prototype.showRestoreVault = function () {
  this.props.dispatch(actions.showRestoreVault())
}

