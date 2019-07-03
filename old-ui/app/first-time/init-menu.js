const inherits = require('util').inherits
const EventEmitter = require('events').EventEmitter
const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../../../ui/app/actions')
const Tooltip = require('../components/tooltip')

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
    warning: state.appState.warning,
  }
}

InitializeMenuScreen.prototype.render = function () {
  var state = this.props

  switch (state.currentView.name) {

    default:
      return this.renderMenu(state)

  }
}

// InitializeMenuScreen.prototype.componentDidMount = function(){
//   document.getElementById('password-box').focus()
// }

InitializeMenuScreen.prototype.renderMenu = function (state) {
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      // disable fox's animation
      /* h(Mascot, {
        animationEventEmitter: this.animationEventEmitter,
      }),*/

      h('.logo'),

      h('h1', {
        style: {
          paddingTop: '50px',
          fontSize: '1.3em',
          color: '#ffffff',
          marginBottom: 10,
        },
      }, 'Nifty Wallet'),


      h('div', [
        h('h3', {
          style: {
            fontSize: '0.8em',
            color: '#ffffff',
            display: 'inline',
          },
        }, 'Encrypt your new DEN'),

        h(Tooltip, {
          title: 'Your DEN is your password-encrypted storage within Nifty Wallet.',
          id: 'initMenu',
        },

        h('i.fa.fa-question-circle.pointer', {
          style: {
            fontSize: '18px',
            position: 'relative',
            color: '#60db97',
            top: '2px',
            marginLeft: '4px',
          },
          'data-tip': '',
          'data-for': 'initMenu',
        })),
      ]),

      state.warning ? h('div', {
        style: {
          width: '260px',
          padding: '20px 0 0',
        },
      }, [
        h('div.error', state.warning),
      ]) : null,

      // password
      h('input.large-input', {
        type: 'password',
        id: 'password-box',
        placeholder: 'New Password (min 8 chars)',
        style: {
          width: 260,
          marginTop: 12,
          border: 'none',
        },
      }),

      // confirm password
      h('input.large-input', {
        type: 'password',
        id: 'password-box-confirm',
        placeholder: 'Confirm Password',
        onKeyPress: this.createVaultOnEnter.bind(this),
        style: {
          width: 260,
          marginTop: 16,
          border: 'none',
        },
      }),


      h('button', {
        onClick: this.createNewVaultAndKeychain.bind(this),
        style: {
          margin: 12,
        },
      }, 'Create'),

      h('.flex-row.flex-center.flex-grow', [
        h('p.pointer', {
          onClick: this.showRestoreVault.bind(this),
          style: {
            fontSize: '0.8em',
            color: '#60db97',
          },
        }, 'Import Existing DEN'),
      ]),

    ])
  )
}

InitializeMenuScreen.prototype.createVaultOnEnter = function (event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewVaultAndKeychain()
  }
}

InitializeMenuScreen.prototype.componentDidMount = function () {
  document.getElementById('password-box').focus()
}

InitializeMenuScreen.prototype.componentWillUnmount = function () {
  this.props.dispatch(actions.displayWarning(''))
}

InitializeMenuScreen.prototype.showRestoreVault = function () {
  this.props.dispatch(actions.showRestoreVault())
}

InitializeMenuScreen.prototype.createNewVaultAndKeychain = function () {
  var passwordBox = document.getElementById('password-box')
  var password = passwordBox.value
  var passwordConfirmBox = document.getElementById('password-box-confirm')
  var passwordConfirm = passwordConfirmBox.value

  if (password.length < 8) {
    this.warning = 'password not long enough'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (password !== passwordConfirm) {
    this.warning = 'passwords don\'t match'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }

  this.props.dispatch(actions.createNewVaultAndKeychain(password))
}
