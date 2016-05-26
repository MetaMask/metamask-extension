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

      h('h3.flex-center.text-transform-uppercase', {
        style: {
          background: '#EBEBEB',
          color: '#AEAEAE',
          marginBottom: 24,
          width: '100%',
          fontSize: '20px',
          padding: 6,
        },
      }, [
        'Create Vault',
      ]),

      // password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box',
        placeholder: 'New Password (min 8 chars)',
        style: {
          width: 260,
          marginTop: 12,
        },
      }),

      // confirm password
      h('input.large-input.letter-spacey', {
        type: 'password',
        id: 'password-box-confirm',
        placeholder: 'Confirm Password',
        onKeyPress: this.createVaultOnEnter.bind(this),
        style: {
          width: 260,
          marginTop: 16,
        },
      }),

      h('.flex-row.flex-space-between', {
        style: {
          marginTop: 30,
          width: '50%',
        },
      }, [

        // cancel
        h('button.primary', {
          onClick: this.showInitializeMenu.bind(this),
        }, 'CANCEL'),

        // submit
        h('button.primary', {
          onClick: this.createNewVault.bind(this),
        }, 'OK'),

      ]),

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
