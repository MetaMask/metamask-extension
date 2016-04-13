const inherits = require('util').inherits

const Component = require('react').Component
const connect = require('react-redux').connect
const h = require('react-hyperscript')
const actions = require('../actions')

module.exports = connect(mapStateToProps)(CreateVaultScreen)


inherits(CreateVaultScreen, Component)
function CreateVaultScreen() {
  Component.call(this)
}

function mapStateToProps(state) {
  return {
    warning: state.appState.warning,
  }
}

CreateVaultScreen.prototype.render = function() {
  var state = this.props
  return (

    h('.initialize-screen.flex-column.flex-center.flex-grow', [

      // subtitle and nav
      h('.section-title.flex-row.flex-center', [
        h('i.fa.fa-arrow-left.fa-lg.cursor-pointer', {
          onClick: this.showInitializeMenu.bind(this),
        }),
        h('h2.page-subtitle', 'Create Vault'),
      ]),

      // password
      h('label', {
        htmlFor: 'password-box',
      }, 'Enter Password (min 8 chars):'),

      h('input', {
        type: 'password',
        id: 'password-box',
      }),

      // confirm password
      h('label', {
        htmlFor: 'password-box-confirm',
      }, 'Confirm Password:'),

      h('input', {
        type: 'password',
        id: 'password-box-confirm',
        onKeyPress: this.createVaultOnEnter.bind(this),
      }),

      /* ENTROPY TEXT INPUT CURRENTLY DISABLED
      // entropy
      h('label', {
        htmlFor: 'entropy-text-entry',
      }, 'Enter random text (optional)'),

      h('textarea', {
        id: 'entropy-text-entry',
        style: { resize: 'none' },
        onKeyPress: this.createVaultOnEnter.bind(this),
      }),
      */

      // submit
      h('button.create-vault.btn-thin', {
        onClick: this.createNewVault.bind(this),
      }, 'OK'),

      (!state.inProgress && state.warning) && (
        h('span.in-progress-notification', state.warning)

      ),

      state.inProgress && (
        h('span.in-progress-notification', 'Generating Seed...')
      ),
    ])
  )
}

CreateVaultScreen.prototype.componentDidMount = function(){
  document.getElementById('password-box').focus()
}

CreateVaultScreen.prototype.showInitializeMenu = function() {
  this.props.dispatch(actions.showInitializeMenu())
}

// create vault

CreateVaultScreen.prototype.createVaultOnEnter = function(event) {
  if (event.key === 'Enter') {
    event.preventDefault()
    this.createNewVault()
  }
}

CreateVaultScreen.prototype.createNewVault = function(){
  var passwordBox = document.getElementById('password-box')
  var password = passwordBox.value
  var passwordConfirmBox = document.getElementById('password-box-confirm')
  var passwordConfirm = passwordConfirmBox.value
  // var entropy = document.getElementById('entropy-text-entry').value

  if (password.length < 8) {
    this.warning = 'password not long enough'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }
  if (password !== passwordConfirm) {
    this.warning = 'passwords dont match'
    this.props.dispatch(actions.displayWarning(this.warning))
    return
  }

  this.props.dispatch(actions.createNewVault(password, ''/*entropy*/))
}
